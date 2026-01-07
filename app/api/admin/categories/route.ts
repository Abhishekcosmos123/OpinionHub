import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import { getAdminFromRequest } from '@/lib/auth';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Category name cannot exceed 50 characters'),
  image: z.string().optional().refine(
    (url) => {
      if (!url) return true; // Optional field
      return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
    },
    { message: 'Invalid image URL or path' }
  ),
});

async function requireAuth(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    throw new Error('Unauthorized');
  }
  return admin;
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    // Build query
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Category.countDocuments(query);

    const categories = await Category.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    await connectDB();

    const body = await request.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, image } = validation.data;
    
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Create category with slug and image (hooks will also generate slug, but this ensures it's set)
    const category = await Category.create({ name, slug, image: image || undefined });

    return NextResponse.json(
      { success: true, category, message: 'Category created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}

