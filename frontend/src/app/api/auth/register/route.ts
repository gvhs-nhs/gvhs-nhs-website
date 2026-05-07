import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'
import { encryptData, decryptData } from '@/lib/encryption'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { setUserSessionCookie } from '@/lib/auth-session'

// Rate limiter: 5 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
})

// Validation Schema
const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").regex(/^[a-zA-Z\s-]+$/, "Name contains invalid characters").max(50),
  lastName: z.string().min(2, "Last name must be at least 2 characters").regex(/^[a-zA-Z\s-]+$/, "Name contains invalid characters").max(50),
  customUserId: z.string().length(6, "User ID must be exactly 6 digits").regex(/^\d+$/, "User ID must be numeric"),
  email: z.string().email("Invalid email address").refine(val => val.endsWith('@gvsd.org'), "Must be a @gvsd.org school email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    try {
      await limiter.check(null, 5, ip)
    } catch {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()

    // 2. Input Validation
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { firstName, lastName, customUserId, email, password } = validation.data

    const cleanEmail = email.toLowerCase().trim();

    // Check if email is already taken
    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (existingEmail) {
      return NextResponse.json({
        message: 'An account with this email already exists. Please use a different email or login with your existing account.'
      }, { status: 400 })
    }

    const fullName = `${firstName} ${lastName}`

    // Check if user with this name already exists
    const { data: existingUserWithName } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('first_name', firstName)
      .eq('last_name', lastName)
      .maybeSingle()

    if (existingUserWithName) {
      return NextResponse.json({
        message: `A user with the name "${fullName}" already exists. Please use a different name or contact an administrator.`
      }, { status: 400 })
    }

    // Check if the custom user ID is already taken
    // User IDs are encrypted with random salt, so we must decrypt all and compare
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('user_id')

    if (allUsers) {
      for (const u of allUsers) {
        try {
          const decrypted = decryptData(u.user_id)
          if (decrypted === customUserId) {
            return NextResponse.json({
              message: `User ID "${customUserId}" is already taken. Please choose a different ID.`
            }, { status: 400 })
          }
        } catch {
          continue
        }
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Encrypt sensitive data
    const encryptedUserId = encryptData(customUserId)
    const encryptedPasswordHash = encryptData(passwordHash)

    // Create new user
    const insertData: Record<string, unknown> = {
      user_id: encryptedUserId,
      first_name: firstName,
      last_name: lastName,
      email: cleanEmail,
      password_hash: encryptedPasswordHash,
    }

    // Try with is_approved first, fall back without if column doesn't exist
    let newUser = null;
    let createError = null;

    const { data: d1, error: e1 } = await supabaseAdmin
      .from('users')
      .insert({ ...insertData, is_approved: true })
      .select()
      .single()

    if (e1 && e1.message?.includes('is_approved')) {
      const { data: d2, error: e2 } = await supabaseAdmin
        .from('users')
        .insert(insertData)
        .select()
        .single()
      newUser = d2;
      createError = e2;
    } else {
      newUser = d1;
      createError = e1;
    }

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: `Failed to create user: ${createError.message}` },
        { status: 500 }
      )
    }

    // SUCCESS - Set Secure Cookie
    await setUserSessionCookie(customUserId);

    return NextResponse.json({
      message: 'Registration successful!',
      id: newUser.id,
      userId: customUserId,
      firstName: firstName,
      lastName: lastName,
      email: cleanEmail,
    })

  } catch (error) {
    console.error('Error in register API:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
