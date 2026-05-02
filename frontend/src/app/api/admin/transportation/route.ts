import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Mock transportation data for admin view
const mockTransportationData = {
  drivers: [
    {
      id: '1',
      submissionId: 'sub_001',
      nhsUserId: '123456',
      name: 'Emily Chen',
      email: 'emily.chen@student.gvsd.org',
      school: 'charlestown',
      teacherLastName: 'Johnson',
      drivingMinutes: 8,
      passengerCapacity: 2,
      createdAt: '2024-01-15T10:30:00Z',
      emergencyContact: 'Mrs. Chen',
      emergencyPhone: '(555) 123-4567'
    },
    {
      id: '2',
      submissionId: 'sub_002',
      nhsUserId: '789012',
      name: 'Marcus Johnson',
      email: 'marcus.johnson@student.gvsd.org',
      school: 'sugartown',
      teacherLastName: 'Davis',
      drivingMinutes: 12,
      passengerCapacity: 3,
      createdAt: '2024-01-15T11:15:00Z',
      emergencyContact: 'Mr. Johnson Sr.',
      emergencyPhone: '(555) 234-5678'
    }
  ],
  riders: [
    {
      id: '3',
      submissionId: 'sub_003',
      nhsUserId: '345678',
      name: 'Sarah Martinez',
      email: 'sarah.martinez@student.gvsd.org',
      school: 'general-wayne',
      teacherLastName: 'Wilson',
      rideNeeds: 'to',
      createdAt: '2024-01-15T12:00:00Z',
      emergencyContact: 'Mrs. Martinez',
      emergencyPhone: '(555) 345-6789'
    },
    {
      id: '4',
      submissionId: 'sub_004',
      nhsUserId: '901234',
      name: 'Alex Kim',
      email: 'alex.kim@student.gvsd.org',
      school: 'kd-markley',
      teacherLastName: 'Brown',
      rideNeeds: 'both',
      createdAt: '2024-01-15T12:30:00Z',
      emergencyContact: 'Dr. Kim',
      emergencyPhone: '(555) 456-7890'
    },
    {
      id: '5',
      submissionId: 'sub_005',
      nhsUserId: '567890',
      name: 'Jamie Lopez',
      email: 'jamie.lopez@student.gvsd.org',
      school: 'charlestown',
      teacherLastName: 'Garcia',
      rideNeeds: 'from',
      createdAt: '2024-01-15T13:00:00Z',
      emergencyContact: 'Ms. Lopez',
      emergencyPhone: '(555) 567-8901'
    }
  ],
  matches: [
    {
      driverId: '1',
      driverName: 'Emily Chen',
      riderId: '3',
      riderName: 'Sarah Martinez',
      distance: 2.1,
      status: 'suggested',
      compatibility: 'high'
    },
    {
      driverId: '2',
      driverName: 'Marcus Johnson',
      riderId: '4',
      riderName: 'Alex Kim',
      distance: 3.8,
      status: 'suggested',
      compatibility: 'medium'
    }
  ]
};

// GET /api/admin/transportation - Get all transportation requests for admin management
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolFilter = searchParams.get('school');
    const typeFilter = searchParams.get('type'); // 'drivers', 'riders', or 'all'

    try {
      // Try to get data from database
      const { data: transportationRequests, error } = await supabase
        .from('nhs_transportation_requests')
        .select(`
          *,
          volunteer_interest_submissions(
            name,
            email,
            preferred_school,
            teacher_last_name,
            emergency_contact,
            emergency_phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return getMockData(schoolFilter, typeFilter);
      }

      // Process real data
      const drivers: any[] = [];
      const riders: any[] = [];

      transportationRequests?.forEach(req => {
        const submission = req.volunteer_interest_submissions;
        const baseData = {
          id: req.id,
          submissionId: req.submission_id,
          nhsUserId: req.nhs_user_id,
          name: submission?.name || 'Unknown',
          email: submission?.email || '',
          school: submission?.preferred_school || 'no-preference',
          teacherLastName: submission?.teacher_last_name || '',
          createdAt: req.created_at,
          emergencyContact: submission?.emergency_contact || '',
          emergencyPhone: submission?.emergency_phone || ''
        };

        if (req.is_driver) {
          drivers.push({
            ...baseData,
            drivingMinutes: req.driving_minutes,
            passengerCapacity: req.passenger_capacity
          });
        } else {
          riders.push({
            ...baseData,
            rideNeeds: req.ride_needs
          });
        }
      });

      // Apply filters
      let filteredDrivers = drivers;
      let filteredRiders = riders;

      if (schoolFilter && schoolFilter !== 'all') {
        filteredDrivers = drivers.filter(d => d.school === schoolFilter);
        filteredRiders = riders.filter(r => r.school === schoolFilter);
      }

      // Generate suggested matches (simple proximity algorithm)
      const matches = generateMatches(filteredDrivers, filteredRiders);

      const responseData = {
        drivers: typeFilter === 'riders' ? [] : filteredDrivers,
        riders: typeFilter === 'drivers' ? [] : filteredRiders,
        matches: typeFilter === 'all' || !typeFilter ? matches : [],
        summary: {
          totalDrivers: drivers.length,
          totalRiders: riders.length,
          totalRequests: drivers.length + riders.length,
          bySchool: {
            charlestown: countBySchool([...drivers, ...riders], 'charlestown'),
            sugartown: countBySchool([...drivers, ...riders], 'sugartown'),
            'general-wayne': countBySchool([...drivers, ...riders], 'general-wayne'),
            'kd-markley': countBySchool([...drivers, ...riders], 'kd-markley'),
            'no-preference': countBySchool([...drivers, ...riders], 'no-preference')
          }
        }
      };

      return NextResponse.json(responseData);

    } catch (dbError) {
      return getMockData(schoolFilter, typeFilter);
    }

  } catch (error) {
    console.error('Error in admin transportation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getMockData(schoolFilter?: string | null, typeFilter?: string | null) {
  let { drivers, riders, matches } = mockTransportationData;

  // Apply school filter
  if (schoolFilter && schoolFilter !== 'all') {
    drivers = drivers.filter(d => d.school === schoolFilter);
    riders = riders.filter(r => r.school === schoolFilter);
    matches = matches.filter(m => {
      const driver = drivers.find(d => d.id === m.driverId);
      const rider = riders.find(r => r.id === m.riderId);
      return driver && rider;
    });
  }

  return NextResponse.json({
    drivers: typeFilter === 'riders' ? [] : drivers,
    riders: typeFilter === 'drivers' ? [] : riders,
    matches: typeFilter === 'all' || !typeFilter ? matches : [],
    summary: {
      totalDrivers: mockTransportationData.drivers.length,
      totalRiders: mockTransportationData.riders.length,
      totalRequests: mockTransportationData.drivers.length + mockTransportationData.riders.length,
      bySchool: {
        charlestown: 2,
        sugartown: 1,
        'general-wayne': 1,
        'kd-markley': 1,
        'no-preference': 0
      }
    },
    note: 'Using mock data - database not available'
  });
}

function generateMatches(drivers: any[], riders: any[]): any[] {
  const matches: any[] = [];

  // Simple matching algorithm - in reality this would use geocoding
  drivers.forEach(driver => {
    riders.forEach(rider => {
      // Mock distance calculation (in reality would use addresses)
      const distance = Math.random() * 5 + 1; // 1-6 miles

      // Check if driver is willing to drive that far
      const timeToDistance = distance * 2; // rough conversion: 2 minutes per mile

      if (timeToDistance <= driver.drivingMinutes) {
        matches.push({
          driverId: driver.id,
          driverName: driver.name,
          riderId: rider.id,
          riderName: rider.name,
          distance: Math.round(distance * 10) / 10,
          status: 'suggested',
          compatibility: distance < 2 ? 'high' : distance < 4 ? 'medium' : 'low'
        });
      }
    });
  });

  return matches.sort((a, b) => a.distance - b.distance);
}

function countBySchool(requests: any[], school: string): number {
  return requests.filter(req => req.school === school).length;
}

// POST /api/admin/transportation - Admin actions (future: approve matches, send notifications)
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    if (action === 'approve_match') {
      // Future: Approve a driver-rider match and send notifications
      return NextResponse.json({
        message: 'Match approved successfully',
        note: 'This is a mock response - notification system not implemented'
      });
    }

    if (action === 'send_reminder') {
      // Future: Send reminder emails to students
      return NextResponse.json({
        message: 'Reminder sent successfully',
        note: 'This is a mock response - email system not implemented'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in admin transportation POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}