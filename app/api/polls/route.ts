import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poll from '@/models/Poll';
import Category from '@/models/Category';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};
    if (categoryId) {
      query.category = categoryId;
    }
    
    // Filter by trending if requested
    const trending = searchParams.get('trending');
    if (trending === 'true') {
      query.isTrending = true;
    } else if (trending === 'false') {
      // Non-trending: isTrending is false or doesn't exist
      query.$or = [
        { isTrending: false },
        { isTrending: { $exists: false } },
      ];
    }
    
    // Add search filter - combine with existing $or if it exists
    if (search) {
      const searchConditions = [
        { productName: { $regex: search, $options: 'i' } },
        { statement: { $regex: search, $options: 'i' } },
      ];
      
      if (query.$or) {
        // If $or already exists (from trending filter), we need to use $and to combine
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions },
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }
    // If trending parameter is not provided, return all polls

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Poll.countDocuments(query);

    // Sort
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
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch polls' },
      { status: 500 }
    );
  }
}

