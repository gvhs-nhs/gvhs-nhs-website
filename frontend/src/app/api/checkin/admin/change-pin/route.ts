import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { decryptData, encryptData, generateRandomPassword } from '@/lib/encryption'
import bcrypt from 'bcryptjs'

// POST /api/checkin/admin/change-pin - Reset user password (admin only)
export async function POST(request: NextRequest) {
  try {
    const { email, newPassword: customPassword } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!customPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      )
    }

    if (customPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Find user by email (since admin only sees masked IDs)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Use provided password
    const newPassword = customPassword
    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    const encryptedPasswordHash = encryptData(newPasswordHash)

    // Update user's password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: encryptedPasswordHash })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user password:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      )
    }

    // Get decrypted user ID for response
    let decryptedUserId
    try {
      decryptedUserId = decryptData(user.user_id)
    } catch (error) {
      console.error('Failed to decrypt user ID:', error)
      decryptedUserId = '***ERROR***'
    }

    return NextResponse.json({
      message: 'User password successfully reset',
      email: user.email,
      userId: decryptedUserId,
      newPassword: newPassword
    })

  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}