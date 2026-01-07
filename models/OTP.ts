import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const OTPSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
      length: [6, 'OTP must be 6 digits'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: { expireAfterSeconds: 0 }, // Auto-delete expired documents
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
OTPSchema.index({ email: 1, used: 1, expiresAt: 1 });

const OTP: Model<IOTP> = mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);

export default OTP;

