import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vote from '@/models/Vote';
import { z } from 'zod';
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

const checkVoteSchema = z.object({
  pollId: z.string().min(1, 'Poll ID is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
  deviceFingerprint: z.string().min(1, 'Device fingerprint is required').optional(),
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

    const { pollId, deviceId, deviceFingerprint } = validation.data;

    // Get client IP address
    const ipAddress = getClientIP(request);
    
    // Get and hash user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const userAgentHash = hashString(userAgent);

    // Use device fingerprint if available, otherwise fall back to deviceId
    const userIdentifier = deviceFingerprint || deviceId;

    // Check if user has already voted using all identifiers
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

