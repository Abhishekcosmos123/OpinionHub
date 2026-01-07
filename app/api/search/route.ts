import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
// Import Category before Poll (Poll references Category, needed for populate)
import Category from '@/models/Category';
import Poll from '@/models/Poll';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const categoryId = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Build search query
    const searchQuery: any = {
      $or: [
        { productName: { $regex: query.trim(), $options: 'i' } },
        { statement: { $regex: query.trim(), $options: 'i' } },
      ],
    };

    // Add category filter if provided
    if (categoryId) {
      searchQuery.category = categoryId;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Poll.countDocuments(searchQuery);

    // Sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch polls
    const polls = await Poll.find(searchQuery)
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
      query: query.trim(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to perform search' },
      { status: 500 }
    );
  }
}

