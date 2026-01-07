import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poll from '@/models/Poll';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch top polls
    const polls = await Poll.find({ isTopPoll: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

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
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch top polls' },
      { status: 500 }
    );
  }
}

