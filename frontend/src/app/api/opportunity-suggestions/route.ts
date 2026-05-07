import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const {
      nhsUserId,
      opportunityTitle,
      description,
      organizationName,
      contactInfo,
      estimatedHours,
      preferredLocation
    } = await request.json();

    // Validate required fields
    if (!nhsUserId || !opportunityTitle || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate NHS User ID format
    if (!/^\d{6}$/.test(nhsUserId)) {
      return NextResponse.json(
        { error: 'NHS User ID must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Insert suggestion into database
    const { data, error } = await supabaseAdmin
      .from('opportunity_suggestions')
      .insert({
        nhs_user_id: nhsUserId,
        opportunity_title: opportunityTitle,
        description: description,
        organization_name: organizationName || null,
        contact_info: contactInfo || null,
        estimated_hours: estimatedHours || null,
        preferred_location: preferredLocation || null,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting opportunity suggestion:', error);
      return NextResponse.json(
        { error: 'Failed to submit suggestion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Suggestion submitted successfully',
      suggestionId: data.id
    });

  } catch (error) {
    console.error('Error in opportunity suggestions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const { data: suggestions, error } = await supabaseAdmin
      .from('opportunity_suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Log error but return empty array instead of 500 to prevent UI breaking
      console.error('Error fetching opportunity suggestions:', error);
      return NextResponse.json({
        suggestions: []
      });
    }

    return NextResponse.json({
      suggestions: suggestions || []
    });

  } catch (error) {
    // Return empty array on error to prevent UI breaking
    console.error('Error in opportunity suggestions GET API:', error);
    return NextResponse.json({
      suggestions: []
    });
  }
}