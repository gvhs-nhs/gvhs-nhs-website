import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'
import { decryptData } from '@/lib/encryption'
import { rateLimit } from '@/lib/rate-limit'
import { setUserSessionCookie } from '@/lib/auth-session'

// Rate limiter: 10 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
})

// POST /api/auth/login - Login with User ID or email and password
export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    try {
      await limiter.check(null, 10, ip)
    } catch {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { userIdOrEmail, password } = await request.json()

    if (!userIdOrEmail || !password) {
      return NextResponse.json(
        { error: 'User ID or email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email or encrypted user ID
    let user = null
    let decryptedUserId = null
    const inputValue = userIdOrEmail.trim().toLowerCase()

    // Check if the input looks like a 6-digit User ID
    const is6DigitId = /^\d{6}$/.test(inputValue)

    if (is6DigitId) {
      // Get all users and decrypt their user IDs to find a match
      // Note: This is inefficient but necessary with app-level encryption. 
      // In a real production app with millions of users, we'd hash the ID separately for lookup.
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('*')

      if (allUsers) {
        for (const u of allUsers) {
          try {
            const decrypted = decryptData(u.user_id)
            if (decrypted === inputValue) {
              user = u
              decryptedUserId = decrypted
              break
            }
          } catch {
            // Skip users with invalid encrypted data
            continue
          }
        }
      }
    }

    // If not found by ID, try email
    if (!user) {
      const { data: userByEmail } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', inputValue)
        .single()

      if (userByEmail) {
        user = userByEmail
        // Decrypt the user ID
        try {
          decryptedUserId = decryptData(userByEmail.user_id)
        } catch (error) {
          console.error('Failed to decrypt user ID:', error)
          return NextResponse.json({
            message: 'Account data corrupted'
          }, { status: 500 })
        }
      }
    }

    if (!user) {
      return NextResponse.json({
        message: 'Invalid User ID/email or password'
      }, { status: 401 })
    }

    // Check if user has a password set
    if (!user.password_hash) {
      return NextResponse.json({
        message: 'This account does not have a password set. Please use your 6-digit ID to login.'
      }, { status: 401 })
    }

    // Decrypt and verify password
    let decryptedPasswordHash
    try {
      decryptedPasswordHash = decryptData(user.password_hash)
    } catch (error) {
      console.error('Failed to decrypt password hash:', error)
      return NextResponse.json({
        message: 'Account data corrupted'
      }, { status: 500 })
    }

    const passwordMatch = await bcrypt.compare(password, decryptedPasswordHash)
    if (!passwordMatch) {
      return NextResponse.json({
        message: 'Invalid User ID/email or password'
      }, { status: 401 })
    }

    // Check Approval Status
    if (user.is_approved === false) {
      return NextResponse.json({
        message: 'Your account is currently pending administrator approval. Please contact an admin or try again later.'
      }, { status: 403 })
    }


    // SUCCESS - Set Secure Cookie
    if (decryptedUserId) {
      await setUserSessionCookie(decryptedUserId);
    }

    // Return user info
    return NextResponse.json({
      message: 'Login successful',
      id: user.id,
      userId: decryptedUserId,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      username: `${user.first_name} ${user.last_name}`.trim()
    })

  } catch (error) {
    console.error('Error in auth/login API:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
