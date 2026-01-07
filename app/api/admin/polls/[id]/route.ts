import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Poll from '@/models/Poll';
import Vote from '@/models/Vote';
import Category from '@/models/Category';
import { getAdminFromRequest } from '@/lib/auth';
import { z } from 'zod';

const pollSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(100, 'Product name cannot exceed 100 characters'),
  statement: z.string().min(1, 'Statement is required').max(500, 'Statement cannot exceed 500 characters'),
  productImage: z.string().min(1, 'Product image is required').refine(
    (url) => {
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    await connectDB();

    const { id } = params;
    const poll = await Poll.findById(id).populate('category', 'name slug');

    if (!poll) {
      return NextResponse.json(
        { success: false, error: 'Poll not found' },
        { status: 404 }
      );
    }

    const totalVotes = poll.yesVotes + poll.noVotes;
    const yesPercentage = totalVotes > 0 ? ((poll.yesVotes / totalVotes) * 100).toFixed(1) : '0';
    const noPercentage = totalVotes > 0 ? ((poll.noVotes / totalVotes) * 100).toFixed(1) : '0';

    return NextResponse.json({
      success: true,
      poll: {
        ...poll.toObject(),
        yesPercentage: parseFloat(yesPercentage),
        noPercentage: parseFloat(noPercentage),
        totalVotes,
      },
    }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch poll' },
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
    const validation = pollSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const poll = await Poll.findById(id);
    if (!poll) {
      return NextResponse.json(
        { success: false, error: 'Poll not found' },
        { status: 404 }
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

    // Update poll
    Object.assign(poll, pollData);
    poll.category = new mongoose.Types.ObjectId(category);
    await poll.save();

    const populatedPoll = await Poll.findById(poll._id).populate('category', 'name slug');

    return NextResponse.json(
      { success: true, poll: populatedPoll, message: 'Poll updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update poll' },
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

    // Check if poll exists
    const poll = await Poll.findById(id);
    if (!poll) {
      return NextResponse.json(
        { success: false, error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Delete all votes for this poll
    await Vote.deleteMany({ poll: id });

    // Delete poll
    await Poll.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: 'Poll deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete poll' },
      { status: 500 }
    );
  }
}
