import { NextRequest, NextResponse } from 'next/server';
import { createSession, COOKIE_NAME } from '@/lib/auth';

const TFA_CODE = '291177';

export async function POST(request: NextRequest) {
  try {
    const { password, tfa } = await request.json();
    const vaultPassword = process.env.VAULT_PASSWORD;

    if (!vaultPassword) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (password !== vaultPassword || tfa !== TFA_CODE) {
      return NextResponse.json(
        { error: 'Invalid password or 2FA code' },
        { status: 401 }
      );
    }

    const token = await createSession();
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
