import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SECRET_KEY = process.env.ADMIN_SECRET_KEY!;
const key = new TextEncoder().encode(SECRET_KEY);

export async function signAdminToken(): Promise<string> {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Session lasts 24 hours
    .sign(key);
  
  return token;
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, key);
    return true;
  } catch (error) {
    return false;
  }
}

export async function setAdminCookie() {
  const token = await signAdminToken();
  const cookieStore = await cookies();
  
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

export async function verifyAdminSession(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get('admin_session')?.value;

  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin access required' },
      { status: 401 }
    );
  }

  return null; // Return null if authorized
}
