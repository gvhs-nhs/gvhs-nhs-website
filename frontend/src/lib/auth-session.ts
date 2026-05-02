import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const USER_SECRET_KEY = process.env.USER_SESSION_SECRET!;
const key = new TextEncoder().encode(USER_SECRET_KEY);

interface UserSessionPayload {
    userId: string; // The 6-digit ID
    role: 'user';
}

export async function signUserToken(userId: string): Promise<string> {
    return new SignJWT({ userId, role: 'user' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // 1 week session
        .sign(key);
}

export async function verifyUserToken(token: string): Promise<UserSessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, key);
        return payload as unknown as UserSessionPayload;
    } catch (error) {
        return null;
    }
}

export async function setUserSessionCookie(userId: string) {
    const token = await signUserToken(userId);
    const cookieStore = await cookies();

    cookieStore.set('user_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });
}

export async function getUserFromSession(): Promise<UserSessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;

    if (!token) return null;
    return verifyUserToken(token);
}

export async function verifyUserSession(request: NextRequest): Promise<UserSessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;

    if (!token) return null;
    return verifyUserToken(token);
}
