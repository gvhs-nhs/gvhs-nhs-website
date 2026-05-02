import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { decryptData } from '@/lib/encryption';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    let user = null;

    try {
      // Get user basic info - try multiple possible ID fields
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      user = userData;

      // If not found, try with unmasked/decrypted ID lookup
      if (userError || !user) {
        // Try to find user by checking if this might be a masked ID
        const { data: allUsers } = await supabase
          .from('users')
          .select('user_id, first_name, last_name, email, created_at');

        if (allUsers) {
          for (const testUser of allUsers) {
            try {
              const decryptedId = testUser.user_id.includes(':') ? decryptData(testUser.user_id) : testUser.user_id;
              if (decryptedId === userId || testUser.user_id === userId) {
                user = testUser;
                userError = null;
                break;
              }
            } catch (e) {
              // Skip users with decryption issues
            }
          }
        }
      }

      if (userError || !user) {
        console.error('User not found with ID:', userId, 'Error:', userError);
        // Return mock user data based on the actual userId for development
        const mockUserData = {
          '123456': { first_name: 'John', last_name: 'Smith', email: 'jsmith@student.gvsd.org' },
          '789012': { first_name: 'Emily', last_name: 'Johnson', email: 'ejohnson@student.gvsd.org' },
          '345678': { first_name: 'Michael', last_name: 'Brown', email: 'mbrown@student.gvsd.org' }
        }[userId] || { first_name: 'Demo', last_name: 'User', email: 'demo@student.gvsd.org' };

        return NextResponse.json({
          user: {
            user_id: userId,
            first_name: mockUserData.first_name,
            last_name: mockUserData.last_name,
            email: mockUserData.email,
            username: `${mockUserData.first_name.toLowerCase()}${mockUserData.last_name.toLowerCase()}`,
            created_at: new Date('2024-09-01').toISOString()
          },
          stats: {
            totalHours: 0,
            totalSessions: 0,
            totalMilliseconds: 0
          },
          recentSessions: [],
          volunteerInterests: [],
          suggestions: [],
          note: 'Mock data - user not found in database'
        });
      }

    } catch (dbError) {
      console.error('Database connection error in admin user profile API:', dbError);
      // Return mock data based on the actual userId on database error
      const mockUserData = {
        '123456': { first_name: 'John', last_name: 'Smith', email: 'jsmith@student.gvsd.org' },
        '789012': { first_name: 'Emily', last_name: 'Johnson', email: 'ejohnson@student.gvsd.org' },
        '345678': { first_name: 'Michael', last_name: 'Brown', email: 'mbrown@student.gvsd.org' }
      }[userId] || { first_name: 'Demo', last_name: 'User', email: 'demo@student.gvsd.org' };

      return NextResponse.json({
        user: {
          user_id: userId,
          first_name: mockUserData.first_name,
          last_name: mockUserData.last_name,
          email: mockUserData.email,
          username: `${mockUserData.first_name.toLowerCase()}${mockUserData.last_name.toLowerCase()}`,
          created_at: new Date('2024-09-01').toISOString()
        },
        stats: {
          totalHours: 0,
          totalSessions: 0,
          totalMilliseconds: 0
        },
        recentSessions: [],
        volunteerInterests: [],
        suggestions: [],
        note: 'Mock data - database connection error'
      });
    }

    // Get user's total hours and sessions using existing API
    let hoursData = null;
    let hoursError = null;
    try {
      // Get the actual user ID for session queries
      const actualUserId = user.user_id.includes(':') ? decryptData(user.user_id) : user.user_id;

      const { data: sessions, error } = await supabase
        .from('session_history')
        .select('duration_ms')
        .eq('user_id', actualUserId);

      if (error) {
        hoursError = error;
      } else {
        const validSessions = sessions?.filter(session =>
          session.duration_ms !== null && session.duration_ms !== undefined
        ) || [];

        const totalMilliseconds = validSessions.reduce((sum, session) =>
          sum + (session.duration_ms || 0), 0
        );

        hoursData = {
          total_hours: totalMilliseconds / (1000 * 60 * 60), // Convert to hours
          total_sessions: validSessions.length,
          total_milliseconds: totalMilliseconds
        };
      }
    } catch (e) {
      hoursError = e;
    }

    // Get user's recent sessions - handle gracefully if table doesn't exist
    let sessions = null;
    let sessionsError = null;
    try {
      // Get the actual user ID for session queries
      const actualUserId = user.user_id.includes(':') ? decryptData(user.user_id) : user.user_id;

      const result = await supabase
        .from('session_history')
        .select('id, user_id, checked_in_at, checked_out_at, duration_ms, forced_by_admin, created_at')
        .eq('user_id', actualUserId)
        .order('checked_in_at', { ascending: false })
        .limit(10);
      sessions = result.data;
      sessionsError = result.error;
    } catch (e) {
      sessionsError = e;
    }

    // Get user's volunteer interest submissions - handle gracefully if table doesn't exist
    let volunteerInterests = null;
    let volunteerError = null;
    try {
      const result = await supabase
        .from('volunteer_interest_submissions')
        .select(`
          *,
          volunteer_events(title)
        `)
        .eq('nhs_user_id', userId)
        .order('created_at', { ascending: false });
      volunteerInterests = result.data;
      volunteerError = result.error;
    } catch (e) {
      volunteerError = e;
    }

    // Get user's opportunity suggestions - handle gracefully if table doesn't exist
    let suggestions = null;
    let suggestionsError = null;
    try {
      const result = await supabase
        .from('opportunity_suggestions')
        .select('*')
        .eq('nhs_user_id', userId)
        .order('created_at', { ascending: false });
      suggestions = result.data;
      suggestionsError = result.error;
    } catch (e) {
      suggestionsError = e;
    }

    // Get user's monthly service submissions
    let monthlyService = null;
    let monthlyServiceError = null;
    try {
      const result = await supabase
        .from('monthly_service_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      monthlyService = result.data;
      monthlyServiceError = result.error;
    } catch (e) {
      monthlyServiceError = e;
    }

    // Get user's ISP submissions (via their project)
    let ispSubmissions = null;
    let ispError = null;
    try {
      // First get the user's project
      const { data: project } = await supabase
        .from('independent_projects')
        .select('id, project_title, status')
        .eq('user_id', userId)
        .single();

      if (project) {
        const { data: checkins, error } = await supabase
          .from('isp_checkins')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false });

        ispSubmissions = {
          project,
          checkins: checkins || []
        };
        ispError = error;
      }
    } catch (e) {
      ispError = e;
    }

    // Get user's event signups
    let eventSignups = null;
    let eventSignupsError = null;
    try {
      const result = await supabase
        .from('event_signups')
        .select(`
          *,
          volunteer_events (
            id, title, event_date, location,
            volunteer_organizations (name, color)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      eventSignups = result.data;
      eventSignupsError = result.error;
    } catch (e) {
      eventSignupsError = e;
    }

    const profileData = {
      user,
      stats: {
        totalHours: hoursData?.total_hours || 0,
        totalSessions: hoursData?.total_sessions || 0,
        totalMilliseconds: hoursData?.total_milliseconds || 0
      },
      recentSessions: sessions || [],
      volunteerInterests: volunteerInterests || [],
      suggestions: suggestions || [],
      monthlyService: monthlyService || [],
      ispSubmissions: ispSubmissions || null,
      eventSignups: eventSignups || []
    };

    // Check for any errors (non-critical)
    if (hoursError) console.error('Error fetching hours:', hoursError);
    if (sessionsError) console.error('Error fetching sessions:', sessionsError);
    if (volunteerError) console.error('Error fetching volunteer interests:', volunteerError);
    if (suggestionsError) console.error('Error fetching suggestions:', suggestionsError);
    if (monthlyServiceError) console.error('Error fetching monthly service:', monthlyServiceError);
    if (ispError) console.error('Error fetching ISP:', ispError);
    if (eventSignupsError) console.error('Error fetching event signups:', eventSignupsError);

    return NextResponse.json(profileData);

  } catch (error) {
    console.error('Error in admin user profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}