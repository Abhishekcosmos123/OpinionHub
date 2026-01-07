/**
 * Migration script to add isTopPoll field to Poll model
 * Run with: npx ts-node --esm migrations/add-top-poll-field.ts
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import Poll from '../models/Poll';

async function migrate() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Update all polls to have isTopPoll: false if not set
    const result = await Poll.updateMany(
      { isTopPoll: { $exists: false } },
      { $set: { isTopPoll: false } }
    );

    console.log(`Migration completed: Updated ${result.modifiedCount} polls`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

