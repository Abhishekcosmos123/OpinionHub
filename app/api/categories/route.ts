import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ name: 1 });
    return NextResponse.json({ success: true, categories }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

