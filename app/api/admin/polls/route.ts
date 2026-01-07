import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
// Import Category before Poll (Poll references Category)
import Category from '@/models/Category';
import Poll from '@/models/Poll';
import { getAdminFromRequest } from '@/lib/auth';
import { z } from 'zod';

const pollSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(100, 'Product name cannot exceed 100 characters'),
  statement: z.string().min(1, 'Statement is required').max(500, 'Statement cannot exceed 500 characters'),
  productImage: z.string().min(1, 'Product image is required').refine(
    (url) => {
      // Allow both http/https URLs and relative paths (for uploaded images)
      return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
    },
    { message: 'Invalid image URL or path' }
  ),
  yesButtonText: z.string().min(1, 'Yes button text is required').max(50, 'Yes button text cannot exceed 50 characters'),
  noButtonText: z.string().min(1, 'No button text is required').max(50, 'No button text cannot exceed 50 characters'),
  category: z.string().min(1, 'Category is required'),
  isTrending: z.boolean().optional().default(false),
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { statement: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Poll.countDocuments(query);

    // Get polls with pagination
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const polls = await Poll.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate percentages
    const pollsWithPercentages = polls.map((poll) => {
      const totalVotes = poll.yesVotes + poll.noVotes;
      const yesPercentage = totalVotes > 0 ? ((poll.yesVotes / totalVotes) * 100).toFixed(1) : '0';
      const noPercentage = totalVotes > 0 ? ((poll.noVotes / totalVotes) * 100).toFixed(1) : '0';

      return {
        ...poll,
        yesPercentage: parseFloat(yesPercentage),
        noPercentage: parseFloat(noPercentage),
        totalVotes,
      };
    });

    return NextResponse.json({
      success: true,
      polls: pollsWithPercentages,
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
      { success: false, error: error.message || 'Failed to fetch polls' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    await connectDB();

    const body = await request.json();
    const validation = pollSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { category, ...pollData } = validation.data;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    const poll = await Poll.create({
      ...pollData,
      category,
    });

    const populatedPoll = await Poll.findById(poll._id).populate('category', 'name slug');

    return NextResponse.json(
      { success: true, poll: populatedPoll, message: 'Poll created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create poll' },
      { status: 500 }
    );
  }
}

