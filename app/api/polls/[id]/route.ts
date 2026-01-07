import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
// Import Category before Poll (Poll references Category, needed for populate)
import Category from '@/models/Category';
import Poll from '@/models/Poll';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch poll' },
      { status: 500 }
    );
  }
}

