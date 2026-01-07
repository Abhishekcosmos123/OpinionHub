/**
 * Migration script to migrate existing images from local storage to Cloudinary
 * 
 * This script:
 * 1. Finds all polls and categories with local image URLs (/uploads/...)
 * 2. Uploads those images to Cloudinary
 * 3. Updates the database with Cloudinary URLs
 * 4. Removes migrated images from local storage
 * 
 * Run with: npm run migrate:cloudinary
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import { readdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import connectDB from '../lib/mongodb';
import Poll from '../models/Poll';
import Category from '../models/Category';
import { uploadFileToCloudinary, isCloudinaryConfigured } from '../lib/cloudinary';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/opinionhub';

async function migrateImagesToCloudinary() {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      console.error('❌ Cloudinary is not configured!');
      console.error('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env.local file');
      process.exit(1);
    }

    console.log('🔄 Starting image migration to Cloudinary...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Get uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    if (!existsSync(uploadsDir)) {
      console.log('⚠️  Uploads directory does not exist. Nothing to migrate.');
      process.exit(0);
    }

    // Get all files in uploads directory
    const files = await readdir(uploadsDir);
    const imageFiles = files.filter(
      (file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    if (imageFiles.length === 0) {
      console.log('⚠️  No image files found in uploads directory.');
      process.exit(0);
    }

    console.log(`📁 Found ${imageFiles.length} image files to migrate\n`);

    // Find all polls with local image URLs
    const polls = await Poll.find({
      productImage: { $regex: '^/uploads/' },
    });

    console.log(`📊 Found ${polls.length} polls with local images`);

    // Find all categories with local image URLs
    const categories = await Category.find({
      image: { $regex: '^/uploads/' },
    });

    console.log(`📊 Found ${categories.length} categories with local images\n`);

    let migratedPolls = 0;
    let migratedCategories = 0;
    let skippedFiles = 0;
    let errors = 0;
    let deletedFiles = 0;

    // Create a map of local URLs to Cloudinary URLs
    const urlMap = new Map<string, string>();
    // Track files that were successfully migrated (for deletion)
    const migratedFiles = new Set<string>();

    // Migrate poll images
    for (const poll of polls) {
      try {
        const localUrl = poll.productImage;
        const fileName = localUrl.replace('/uploads/', '');
        const filePath = join(uploadsDir, fileName);

        if (!existsSync(filePath)) {
          console.log(`⚠️  File not found: ${filePath}, skipping poll ${poll._id}`);
          skippedFiles++;
          continue;
        }

        // Check if we've already uploaded this file
        if (urlMap.has(localUrl)) {
          poll.productImage = urlMap.get(localUrl)!;
          await poll.save();
          migratedPolls++;
          console.log(`✅ Updated poll ${poll._id} with existing Cloudinary URL`);
          continue;
        }

        // Upload to Cloudinary
        console.log(`📤 Uploading ${fileName} to Cloudinary...`);
        const cloudinaryUrl = await uploadFileToCloudinary(filePath, 'opinionhub/polls');
        
        // Store mapping
        urlMap.set(localUrl, cloudinaryUrl);
        
        // Update poll
        poll.productImage = cloudinaryUrl;
        await poll.save();
        
        // Mark file for deletion
        migratedFiles.add(filePath);
        
        migratedPolls++;
        console.log(`✅ Migrated poll ${poll._id}: ${localUrl} → Cloudinary`);
      } catch (error: any) {
        console.error(`❌ Error migrating poll ${poll._id}:`, error.message);
        errors++;
      }
    }

    // Migrate category images
    for (const category of categories) {
      try {
        const localUrl = category.image;
        if (!localUrl) continue;

        const fileName = localUrl.replace('/uploads/', '');
        const filePath = join(uploadsDir, fileName);

        if (!existsSync(filePath)) {
          console.log(`⚠️  File not found: ${filePath}, skipping category ${category._id}`);
          skippedFiles++;
          continue;
        }

        // Check if we've already uploaded this file
        if (urlMap.has(localUrl)) {
          category.image = urlMap.get(localUrl)!;
          await category.save();
          migratedCategories++;
          console.log(`✅ Updated category ${category._id} with existing Cloudinary URL`);
          continue;
        }

        // Upload to Cloudinary
        console.log(`📤 Uploading ${fileName} to Cloudinary...`);
        const cloudinaryUrl = await uploadFileToCloudinary(filePath, 'opinionhub/categories');
        
        // Store mapping
        urlMap.set(localUrl, cloudinaryUrl);
        
        // Update category
        category.image = cloudinaryUrl;
        await category.save();
        
        // Mark file for deletion
        migratedFiles.add(filePath);
        
        migratedCategories++;
        console.log(`✅ Migrated category ${category._id}: ${localUrl} → Cloudinary`);
      } catch (error: any) {
        console.error(`❌ Error migrating category ${category._id}:`, error.message);
        errors++;
      }
    }

    // Delete successfully migrated files
    console.log('\n🗑️  Cleaning up local files...');
    for (const filePath of migratedFiles) {
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
          deletedFiles++;
          const fileName = filePath.split('/').pop();
          console.log(`🗑️  Deleted: ${fileName}`);
        }
      } catch (error: any) {
        console.error(`❌ Error deleting file ${filePath}:`, error.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary');
    console.log('='.repeat(50));
    console.log(`✅ Migrated polls: ${migratedPolls}`);
    console.log(`✅ Migrated categories: ${migratedCategories}`);
    console.log(`🗑️  Deleted local files: ${deletedFiles}`);
    console.log(`⚠️  Skipped files: ${skippedFiles}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(50));

    if (migratedPolls > 0 || migratedCategories > 0) {
      console.log('\n✅ Migration completed successfully!');
      if (deletedFiles > 0) {
        console.log(`💡 ${deletedFiles} local image files have been removed.`);
      }
    } else {
      console.log('\n⚠️  No images were migrated.');
    }

    console.log('\n✅ Migration completed!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateImagesToCloudinary();

