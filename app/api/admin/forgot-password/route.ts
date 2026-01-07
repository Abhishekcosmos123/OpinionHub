import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import OTP from '@/models/OTP';
import { sendOTPEmail } from '@/lib/email';
import { z } from 'zod';

const requestOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validation = requestOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Don't reveal if email exists or not (security best practice)
      return NextResponse.json(
        { success: true, message: 'If the email exists, an OTP has been sent.' },
        { status: 200 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Invalidate any existing unused OTPs for this email
    await OTP.updateMany(
      { email, used: false },
      { used: true }
    );

    // Create new OTP
    await OTP.create({
      email,
      otp,
      expiresAt,
      used: false,
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);
    
    // Even if email sending fails, we still return success (security best practice)
    // The OTP is logged to console in development mode
    // In production, check server logs if email sending fails
    if (!emailSent) {
      console.warn(`⚠️  Email sending failed for ${email}, but OTP was created. Check server logs for OTP.`);
      // Still return success to not reveal if email exists
      // The OTP is available in server logs
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'If the email exists, an OTP has been sent to your email address. Please check your inbox (and spam folder).' 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

