import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      required: false, // Auto-generated, not required in input
      unique: true,
      lowercase: true,
    },
    image: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Create slug from name before saving
CategorySchema.pre('save', function (next) {
  // Always generate slug from name if name exists
  if (this.name && typeof this.name === 'string') {
    this.slug = generateSlug(this.name);
  }
  next();
});

// Generate slug before validation (runs before validation)
CategorySchema.pre('validate', function (next) {
  // Always generate slug from name before validation
  if (this.name && typeof this.name === 'string') {
    this.slug = generateSlug(this.name);
  }
  next();
});

// Register model - mongoose.model() is safe to call multiple times
// It will return the existing model if already registered
// This pattern ensures the model is always registered, critical for serverless
// Check if mongoose.models exists (it might not in some serverless environments)
const Category: Model<ICategory> = 
  (mongoose.models && mongoose.models.Category) 
    ? (mongoose.models.Category as Model<ICategory>)
    : mongoose.model<ICategory>('Category', CategorySchema);

export default Category;

