import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vote from '@/models/Vote';
import { z } from 'zod';

const checkVoteSchema = z.object({
  pollId: z.string().min(1, 'Poll ID is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validation = checkVoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { pollId, deviceId } = validation.data;

    // Check if user has already voted
    const existingVote = await Vote.findOne({ poll: pollId, userIdentifier: deviceId });

    return NextResponse.json(
      { 
        success: true, 
        hasVoted: !!existingVote,
        vote: existingVote ? existingVote.vote : null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check vote status' },
      { status: 500 }
    );
  }
}

