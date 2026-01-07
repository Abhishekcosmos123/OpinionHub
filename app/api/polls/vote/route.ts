import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
// Import models in dependency order: Category -> Poll -> Vote
import Category from '@/models/Category';
import Poll from '@/models/Poll';
import Vote from '@/models/Vote';
import { z } from 'zod';
import { verifyToken } from '@/lib/captchaTokens';
import { getClientIP } from '@/lib/utils';

// Simple hash function for user agent
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

const voteSchema = z.object({
  pollId: z.string().min(1, 'Poll ID is required'),
  vote: z.enum(['yes', 'no'], { required_error: 'Vote is required' }),
  captchaToken: z.string().min(1, 'CAPTCHA verification is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
  deviceFingerprint: z.string().min(1, 'Device fingerprint is required').optional(),
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

    const { pollId, vote, captchaToken, deviceId, deviceFingerprint } = validation.data;

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

    // Get client IP address
    const ipAddress = getClientIP(request);
    
    // Get and hash user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const userAgentHash = hashString(userAgent);

    // Use device fingerprint if available, otherwise fall back to deviceId
    // Device fingerprint is more persistent and harder to change
    const userIdentifier = deviceFingerprint || deviceId;

    // Check if user already voted using multiple identifiers for security
    // This prevents voting again even if cache/cookies are cleared
    const existingVote = await Vote.findOne({
      poll: pollId,
      $or: [
        { userIdentifier: deviceId },
        { userIdentifier: deviceFingerprint },
        { deviceId: deviceId },
        ...(deviceFingerprint ? [{ deviceFingerprint: deviceFingerprint }] : []),
        ...(ipAddress !== 'unknown' ? [{ ipAddress: ipAddress }] : []),
        { userAgentHash: userAgentHash }
      ]
    });
    
    if (existingVote) {
      return NextResponse.json(
        { success: false, error: 'You have already voted on this poll' },
        { status: 400 }
      );
    }

    // Create vote with all identifiers
    await Vote.create({
      poll: pollId,
      userIdentifier,
      deviceId: deviceId,
      deviceFingerprint: deviceFingerprint || undefined,
      ipAddress: ipAddress !== 'unknown' ? ipAddress : undefined,
      userAgentHash: userAgentHash,
      vote,
    });

    // Update poll vote counts
    if (vote === 'yes') {
      poll.yesVotes += 1;
    } else {
      poll.noVotes += 1;
    }
    await poll.save();

    // Populate category if it exists
    await poll.populate('category', 'name image slug');

    // Calculate percentages
    const totalVotes = poll.yesVotes + poll.noVotes;
    const yesPercentage = totalVotes > 0 ? ((poll.yesVotes / totalVotes) * 100).toFixed(1) : '0';
    const noPercentage = totalVotes > 0 ? ((poll.noVotes / totalVotes) * 100).toFixed(1) : '0';

    // Convert poll to plain object
    const pollObject = poll.toObject();
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Vote recorded successfully',
        poll: {
          ...pollObject,
          totalVotes,
          yesPercentage: parseFloat(yesPercentage),
          noPercentage: parseFloat(noPercentage),
        }
      },
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

