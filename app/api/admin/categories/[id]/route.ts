import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import Poll from '@/models/Poll';
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    await connectDB();

    const { id } = params;
    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, category }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
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

    // Update category
    category.name = name;
    category.slug = slug;
    if (image !== undefined) {
      category.image = image || undefined;
    }
    await category.save();

    return NextResponse.json(
      { success: true, category, message: 'Category updated successfully' },
      { status: 200 }
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
      { success: false, error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    await connectDB();

    const { id } = params;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category is used in any polls
    const pollsCount = await Poll.countDocuments({ category: id });
    if (pollsCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category. It is used in ${pollsCount} poll(s)` },
        { status: 400 }
      );
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: 'Category deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
