import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
// Import Category before Poll (Poll references Category)
import Category from '@/models/Category';
import Poll from '@/models/Poll';
import Vote from '@/models/Vote';
import { getAdminFromRequest } from '@/lib/auth';

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

    // Get total counts
    const totalPolls = await Poll.countDocuments({});
    const totalCategories = await Category.countDocuments({});
    const totalVotes = await Vote.countDocuments({});
    const trendingPolls = await Poll.countDocuments({ isTrending: true });

    // Get top performing polls (by total votes)
    const topPolls = await Poll.find({})
      .populate('category', 'name')
      .sort({ yesVotes: -1, noVotes: -1 })
      .limit(5)
      .lean();

    const topPollsWithStats = topPolls.map((poll) => {
      const totalVotes = poll.yesVotes + poll.noVotes;
      const yesPercentage = totalVotes > 0 ? ((poll.yesVotes / totalVotes) * 100).toFixed(0) : '0';
      const noPercentage = totalVotes > 0 ? ((poll.noVotes / totalVotes) * 100).toFixed(0) : '0';

      return {
        name: poll.productName,
        votes: totalVotes,
        yes: parseInt(yesPercentage),
        no: parseInt(noPercentage),
      };
    });

    // Get recent polls (last 5 created)
    const recentPolls = await Poll.find({})
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent votes (last 10)
    const recentVotes = await Vote.find({})
      .populate('poll', 'productName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Format recent activity
    const recentActivity = [
      ...recentVotes.slice(0, 5).map((vote: any) => ({
        type: 'vote',
        poll: vote.poll?.productName || 'Unknown',
        time: formatTimeAgo(new Date(vote.createdAt)),
      })),
      ...recentPolls.slice(0, 3).map((poll: any) => ({
        type: 'poll',
        poll: poll.productName,
        time: formatTimeAgo(new Date(poll.createdAt)),
      })),
    ]
      .sort((a, b) => {
        // Sort by time (most recent first)
        const timeA = getTimeInMinutes(a.time);
        const timeB = getTimeInMinutes(b.time);
        return timeA - timeB;
      })
      .slice(0, 5);

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalPolls,
          totalVotes,
          trendingPolls,
          totalCategories,
          topPolls: topPollsWithStats,
          recentActivity,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
}

function getTimeInMinutes(timeString: string): number {
  const match = timeString.match(/(\d+)\s+(second|minute|hour|day|week)/);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'second':
      return value / 60;
    case 'minute':
      return value;
    case 'hour':
      return value * 60;
    case 'day':
      return value * 24 * 60;
    case 'week':
      return value * 7 * 24 * 60;
    default:
      return 0;
  }
}

