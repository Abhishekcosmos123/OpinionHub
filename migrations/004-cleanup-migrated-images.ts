/**
 * Cleanup script to remove local image files that have been migrated to Cloudinary
 * 
 * This script:
 * 1. Finds all polls and categories with Cloudinary URLs
 * 2. Removes corresponding local files from public/uploads/
 * 
 * Run with: npm run migrate:cleanup
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import connectDB from '../lib/mongodb';
import Poll from '../models/Poll';
import Category from '../models/Category';

async function cleanupMigratedImages() {
  try {
    console.log('🔄 Starting cleanup of migrated images...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Get uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    if (!existsSync(uploadsDir)) {
      console.log('⚠️  Uploads directory does not exist. Nothing to clean up.');
      process.exit(0);
    }

    // Find all polls with Cloudinary URLs
    const polls = await Poll.find({
      productImage: { $regex: 'cloudinary.com' },
    });

    console.log(`📊 Found ${polls.length} polls with Cloudinary URLs`);

    // Find all categories with Cloudinary URLs
    const categories = await Category.find({
      image: { $regex: 'cloudinary.com' },
    });

    console.log(`📊 Found ${categories.length} categories with Cloudinary URLs\n`);

    // Get all local files that might need cleanup
    const allPolls = await Poll.find({});
    const allCategories = await Category.find({});
    
    // Collect all local file paths that are referenced in database
    const referencedFiles = new Set<string>();
    
    for (const poll of allPolls) {
      if (poll.productImage && poll.productImage.startsWith('/uploads/')) {
        const fileName = poll.productImage.replace('/uploads/', '');
        referencedFiles.add(fileName);
      }
    }
    
    for (const category of allCategories) {
      if (category.image && category.image.startsWith('/uploads/')) {
        const fileName = category.image.replace('/uploads/', '');
        referencedFiles.add(fileName);
      }
    }

    console.log(`📁 Found ${referencedFiles.size} local files still referenced in database`);
    
    // Find all image files in uploads directory
    const { readdir } = await import('fs/promises');
    const files = await readdir(uploadsDir);
    const imageFiles = files.filter(
      (file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    console.log(`📁 Found ${imageFiles.length} image files in uploads directory\n`);

    let deletedFiles = 0;
    let keptFiles = 0;
    let errors = 0;

    // Delete files that are NOT referenced (already migrated)
    for (const file of imageFiles) {
      const filePath = join(uploadsDir, file);
      
      // If file is not referenced in database, it's safe to delete
      if (!referencedFiles.has(file)) {
        try {
          if (existsSync(filePath)) {
            await unlink(filePath);
            deletedFiles++;
            console.log(`🗑️  Deleted: ${file} (not referenced in database)`);
          }
        } catch (error: any) {
          console.error(`❌ Error deleting file ${file}:`, error.message);
          errors++;
        }
      } else {
        keptFiles++;
        console.log(`📌 Kept: ${file} (still referenced in database)`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Cleanup Summary');
    console.log('='.repeat(50));
    console.log(`🗑️  Deleted files: ${deletedFiles}`);
    console.log(`📌 Kept files: ${keptFiles}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(50));

    if (deletedFiles > 0) {
      console.log('\n✅ Cleanup completed successfully!');
      console.log(`💡 ${deletedFiles} migrated image files have been removed from local storage.`);
    } else {
      console.log('\n⚠️  No files were deleted. All files are still referenced in the database.');
    }

    console.log('\n✅ Cleanup completed!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupMigratedImages();

