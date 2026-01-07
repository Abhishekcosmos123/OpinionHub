import mongoose from 'mongoose';
import Poll from '../models/Poll';

/**
 * Migration: Add isTrending field to Polls collection
 * This migration adds the isTrending field to all existing polls
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/opinionhub';

async function addTrendingField() {
  try {
    console.log('🔄 Starting migration: Add isTrending field to Polls...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update all polls that don't have isTrending field
    const result = await Poll.updateMany(
      { isTrending: { $exists: false } },
      { $set: { isTrending: false } }
    );

    console.log(`✅ Updated ${result.modifiedCount} poll(s) with isTrending field`);
    console.log('✅ Migration completed successfully!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

// Load environment variables from .env.local
if (typeof require !== 'undefined' && require.main === module) {
  try {
    require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
  } catch (e) {
    // dotenv not available, will use process.env or defaults
  }
  
  // Run migration
  addTrendingField();
}

