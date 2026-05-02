import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Mock data for demonstration
const mockDrivers = [
  {
    id: '1',
    name: 'Emily Chen',
    contactEmail: 'emily.chen@student.gvsd.org',
    drivingMinutes: 8,
    passengerCapacity: 2,
    address: 'Hidden for privacy',
    distance: 2.1
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    contactEmail: 'marcus.johnson@student.gvsd.org',
    drivingMinutes: 12,
    passengerCapacity: 3,
    address: 'Hidden for privacy',
    distance: 3.8
  }
];

const mockRiders = [
  {
    id: '1',
    name: 'Sarah M.',
    contactEmail: 'sarah.martinez@student.gvsd.org',
    rideNeeds: 'to',
    address: 'Hidden for privacy',
    distance: 2.1
  },
  {
    id: '2',
    name: 'Alex K.',
    contactEmail: 'alex.kim@student.gvsd.org',
    rideNeeds: 'both',
    address: 'Hidden for privacy',
    distance: 3.5
  },
  {
    id: '3',
    name: 'Jamie L.',
    contactEmail: 'jamie.lopez@student.gvsd.org',
    rideNeeds: 'from',
    address: 'Hidden for privacy',
    distance: 1.8
  }
];

// GET /api/transportation - Get transportation requests and matches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'drivers' | 'riders' | 'matches'
    const userId = searchParams.get('userId');

    // For now, return mock data. In the future, this would query the database
    if (type === 'drivers') {
      return NextResponse.json({
        drivers: mockDrivers
      });
    }

    if (type === 'riders') {
      return NextResponse.json({
        riders: mockRiders
      });
    }

    if (type === 'matches' && userId) {
      // Mock proximity matching - in reality this would use geocoding and distance calculation
      try {
        const { data: userTransportation, error } = await supabase
          .from('nhs_transportation_requests')
          .select('*')
          .eq('nhs_user_id', userId)
          .single();

        if (error || !userTransportation) {
          // Return mock matches based on user type
          return NextResponse.json({
            matches: userTransportation?.is_driver ? mockRiders : mockDrivers,
            userType: userTransportation?.is_driver ? 'driver' : 'rider'
          });
        }

        // Return matches based on whether user is driver or rider
        const matches = userTransportation.is_driver ? mockRiders : mockDrivers;

        return NextResponse.json({
          matches,
          userType: userTransportation.is_driver ? 'driver' : 'rider',
          userPreferences: {
            drivingMinutes: userTransportation.driving_minutes,
            passengerCapacity: userTransportation.passenger_capacity,
            rideNeeds: userTransportation.ride_needs
          }
        });

      } catch (dbError) {
        // Fallback to mock data if database isn't available
        return NextResponse.json({
          matches: mockRiders, // Default to showing riders
          userType: 'driver'
        });
      }
    }

    // Default: return all transportation requests
    try {
      const { data: transportationRequests, error } = await supabase
        .from('nhs_transportation_requests')
        .select(`
          *,
          volunteer_interest_submissions(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({
          requests: [],
          drivers: mockDrivers,
          riders: mockRiders,
          note: 'Using mock data - database table not available'
        });
      }

      // Separate drivers and riders
      const drivers = transportationRequests?.filter(req => req.is_driver) || [];
      const riders = transportationRequests?.filter(req => !req.is_driver) || [];

      return NextResponse.json({
        requests: transportationRequests || [],
        drivers,
        riders
      });

    } catch (dbError) {
      return NextResponse.json({
        requests: [],
        drivers: mockDrivers,
        riders: mockRiders,
        note: 'Using mock data - database not available'
      });
    }

  } catch (error) {
    console.error('Error in transportation GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/transportation - Contact/match functionality (future feature)
export async function POST(request: NextRequest) {
  try {
    const { action, driverId, riderId, message } = await request.json();

    if (action === 'contact') {
      // In the future, this could send notifications or create contact records
      // For now, just return success
      return NextResponse.json({
        message: 'Contact request sent successfully',
        note: 'This is a mock response - actual contact system not implemented'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in transportation POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/transportation - Cancel transportation request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    try {
      const { error } = await supabase
        .from('nhs_transportation_requests')
        .delete()
        .eq('nhs_user_id', userId);

      if (error) {
        return NextResponse.json({
          message: 'Transportation request canceled (mock response)',
          note: 'Database table not available'
        });
      }

      return NextResponse.json({
        message: 'Transportation request canceled successfully'
      });

    } catch (dbError) {
      return NextResponse.json({
        message: 'Transportation request canceled (mock response)',
        note: 'Database not available'
      });
    }

  } catch (error) {
    console.error('Error in transportation DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}