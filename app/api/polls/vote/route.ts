import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poll from '@/models/Poll';
import Vote from '@/models/Vote';
import { z } from 'zod';
import { verifyToken } from '@/lib/captchaTokens';

const voteSchema = z.object({
  pollId: z.string().min(1, 'Poll ID is required'),
  vote: z.enum(['yes', 'no'], { required_error: 'Vote is required' }),
  captchaToken: z.string().min(1, 'CAPTCHA verification is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
});

async function verifyCaptcha(token: string): Promise<boolean> {
  try {
    return verifyToken(token);
  } catch (error) {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validation = voteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { pollId, vote, captchaToken, deviceId } = validation.data;

    // Verify CAPTCHA
    const isCaptchaValid = await verifyCaptcha(captchaToken);
    
    if (!isCaptchaValid) {
      return NextResponse.json(
        { success: false, error: 'CAPTCHA verification failed' },
        { status: 400 }
      );
    }

    // Check if poll exists
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return NextResponse.json(
        { success: false, error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Use device ID as user identifier
    const userIdentifier = deviceId;

    // Check if user already voted
    const existingVote = await Vote.findOne({ poll: pollId, userIdentifier });
    if (existingVote) {
      return NextResponse.json(
        { success: false, error: 'You have already voted on this poll' },
        { status: 400 }
      );
    }

    // Create vote
    await Vote.create({
      poll: pollId,
      userIdentifier,
      vote,
    });

    // Update poll vote counts
    if (vote === 'yes') {
      poll.yesVotes += 1;
    } else {
      poll.noVotes += 1;
    }
    await poll.save();

    return NextResponse.json(
      { success: true, message: 'Vote recorded successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'You have already voted on this poll' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record vote' },
      { status: 500 }
    );
  }
}

