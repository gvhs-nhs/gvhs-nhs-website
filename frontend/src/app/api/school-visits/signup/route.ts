import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// POST /api/school-visits/signup - Sign up for a school visit
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      firstName,
      lastName,
      eventId,
      eventDate,
      school,
      hasRide,
      canGiveRide,
      rideCapacity,
      teacherLastName
    } = await request.json()

    if (!userId || !eventId || !teacherLastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already signed up for this event
    const { data: existingSignup } = await supabaseAdmin
      .from('school_visit_signups')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single()

    if (existingSignup) {
      return NextResponse.json({
        message: 'You are already signed up for this event.'
      }, { status: 400 })
    }

    // Create the signup
    const { data: newSignup, error } = await supabaseAdmin
      .from('school_visit_signups')
      .insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        event_id: eventId,
        event_date: eventDate,
        school: school,
        has_ride: hasRide,
        can_give_ride: canGiveRide,
        ride_capacity: rideCapacity || 0,
        teacher_last_name: teacherLastName.trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating school visit signup:', error)
      // Check if table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json({
          message: 'School visits signup system is not yet configured. Please contact the administrator.'
        }, { status: 500 })
      }
      return NextResponse.json(
        { error: 'Failed to sign up for school visit' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully signed up for the school visit!',
      signup: newSignup
    })

  } catch (error) {
    console.error('Error in school-visits signup API:', error)
    return NextResponse.json(
      { error: 'Failed to sign up for school visit' },
      { status: 500 }
    )
  }
}
