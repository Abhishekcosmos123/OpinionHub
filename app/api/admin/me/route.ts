import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, admin: { email: admin.email } },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}

