import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { generateToken } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find admin
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken({ adminId: admin._id.toString(), email: admin.email });

    // Create response
    const response = NextResponse.json(
      { success: true, message: 'Login successful', admin: { email: admin.email } },
      { status: 200 }
    );

    // Set cookie
    response.cookies.set('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

