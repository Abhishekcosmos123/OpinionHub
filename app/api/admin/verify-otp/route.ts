import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OTP from '@/models/OTP';
import { z } from 'zod';

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validation = verifyOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, otp } = validation.data;

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      used: false,
      expiresAt: { $gt: new Date() }, // Not expired
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Don't mark OTP as used here - it will be marked as used in reset-password
    // This allows the OTP to be verified and then used for password reset
    // The OTP is only marked as used after successful password reset

    return NextResponse.json(
      { success: true, message: 'OTP verified successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}

