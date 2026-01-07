import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVote extends Document {
  poll: mongoose.Types.ObjectId;
  userIdentifier: string; // Primary identifier (device fingerprint or deviceId)
  deviceId?: string; // Device ID from localStorage
  deviceFingerprint?: string; // Browser fingerprint
  ipAddress?: string; // Client IP address
  userAgentHash?: string; // Hashed user agent
  vote: 'yes' | 'no';
  createdAt: Date;
}

const VoteSchema: Schema = new Schema(
  {
    poll: {
      type: Schema.Types.ObjectId,
      ref: 'Poll',
      required: [true, 'Poll is required'],
    },
    userIdentifier: {
      type: String,
      required: [true, 'User identifier is required'],
    },
    deviceId: {
      type: String,
      index: true,
    },
    deviceFingerprint: {
      type: String,
      index: true,
    },
    ipAddress: {
      type: String,
      index: true,
    },
    userAgentHash: {
      type: String,
      index: true,
    },
    vote: {
      type: String,
      enum: ['yes', 'no'],
      required: [true, 'Vote is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index to prevent duplicate votes by userIdentifier
VoteSchema.index({ poll: 1, userIdentifier: 1 }, { unique: true });

// Indexes for checking duplicates by other identifiers
VoteSchema.index({ poll: 1, deviceId: 1 });
VoteSchema.index({ poll: 1, deviceFingerprint: 1 });
VoteSchema.index({ poll: 1, ipAddress: 1 });
VoteSchema.index({ poll: 1, userAgentHash: 1 });

const Vote: Model<IVote> = mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema);

export default Vote;

