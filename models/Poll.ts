import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPoll extends Document {
  productName: string;
  statement: string;
  productImage: string;
  yesButtonText: string;
  noButtonText: string;
  category: mongoose.Types.ObjectId;
  yesVotes: number;
  noVotes: number;
  isTrending: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PollSchema: Schema = new Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    statement: {
      type: String,
      required: [true, 'Statement is required'],
      trim: true,
      maxlength: [500, 'Statement cannot exceed 500 characters'],
    },
    productImage: {
      type: String,
      required: [true, 'Product image is required'],
      trim: true,
    },
    yesButtonText: {
      type: String,
      required: [true, 'Yes button text is required'],
      trim: true,
      default: 'Yes',
      maxlength: [50, 'Yes button text cannot exceed 50 characters'],
    },
    noButtonText: {
      type: String,
      required: [true, 'No button text is required'],
      trim: true,
      default: 'No',
      maxlength: [50, 'No button text cannot exceed 50 characters'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    yesVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    noVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Delete the model if it exists to avoid caching issues
if (mongoose.models.Poll) {
  delete mongoose.models.Poll;
}

const Poll: Model<IPoll> = mongoose.model<IPoll>('Poll', PollSchema);

export default Poll;

