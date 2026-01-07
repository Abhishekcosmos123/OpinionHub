import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVote extends Document {
  poll: mongoose.Types.ObjectId;
  userIdentifier: string; // Device ID
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

// Compound index to prevent duplicate votes
VoteSchema.index({ poll: 1, userIdentifier: 1 }, { unique: true });

const Vote: Model<IVote> = mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema);

export default Vote;

