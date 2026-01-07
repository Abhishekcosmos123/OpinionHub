import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import OTP from '@/models/OTP';
import { generateToken } from '@/lib/auth';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, otp, newPassword } = validation.data;

    // Verify OTP first
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Find admin and select password field
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Update password (Mongoose middleware will hash it)
    // Explicitly mark password as modified to ensure the pre-save hook runs
    admin.password = newPassword;
    admin.markModified('password');
    await admin.save();

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // Generate token and automatically log in the user
    const token = generateToken({ adminId: admin._id.toString(), email: admin.email });

    // Create response
    const response = NextResponse.json(
      { success: true, message: 'Password reset successfully. You have been automatically logged in.' },
      { status: 200 }
    );

    // Set authentication cookie
    response.cookies.set('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}

