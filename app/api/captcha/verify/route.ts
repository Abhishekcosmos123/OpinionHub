import { NextRequest, NextResponse } from 'next/server';
import { storeToken, verifyToken } from '@/lib/captchaTokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify token
    const isValid = verifyToken(token);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'CAPTCHA verified successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('CAPTCHA verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify CAPTCHA' },
      { status: 500 }
    );
  }
}

// Store a token (called from the frontend after successful CAPTCHA)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Store token
    storeToken(token);

    return NextResponse.json(
      { success: true, message: 'Token stored successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Token storage error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to store token' },
      { status: 500 }
    );
  }
}

