import { NextRequest, NextResponse } from 'next/server'
import { setAdminCookie } from '@/lib/auth-admin';

// POST /api/admin/auth - Authenticate admin PIN
export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin) {
      return NextResponse.json(
        { error: 'Admin PIN is required' },
        { status: 400 }
      )
    }

    const masterAdminPin = process.env.MASTER_ADMIN_PIN;
    if (masterAdminPin && pin === masterAdminPin) {
      await setAdminCookie();
      return NextResponse.json({
        success: true,
        message: 'Master admin access granted'
      })
    }

    const adminPin = process.env.ADMIN_PIN;
    if (!adminPin) {
      return NextResponse.json({ error: 'Admin PIN not configured' }, { status: 500 })
    }
    if (pin === adminPin) {
      await setAdminCookie();
      return NextResponse.json({
        success: true,
        message: 'Admin access granted'
      })
    }

    // If neither PIN matches, return error
    return NextResponse.json({
      error: 'Invalid admin PIN'
    }, { status: 401 })

  } catch (error) {
    console.error('Admin authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}