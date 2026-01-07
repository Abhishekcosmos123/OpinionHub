import mongoose from 'mongoose';
import Admin from '../models/Admin';

/**
 * Migration: Create default admin account
 * This migration creates an admin user if one doesn't exist
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/opinionhub';

async function createAdmin() {
  try {
    console.log('🔄 Starting migration: Create Admin Account...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Default admin credentials
    const defaultEmail = 'abhishek.singh@cosmostaker.com';
    const defaultPassword = 'Admin@12';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: defaultEmail });
    
    if (existingAdmin) {
      console.log(`⚠️  Admin with email ${defaultEmail} already exists.`);
      console.log('   Skipping migration...');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin account
    console.log('📝 Creating admin account...');
    const admin = await Admin.create({
      email: defaultEmail,
      password: defaultPassword,
    });

    console.log('✅ Admin account created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('   Email:', defaultEmail);
    console.log('   Password:', defaultPassword);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    console.log('\n✅ Migration completed successfully!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === 11000) {
      console.error('   Admin account already exists (duplicate key error)');
    }
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

// Load environment variables from .env.local
if (typeof require !== 'undefined' && require.main === module) {
  // Try to load .env.local if dotenv is available
  try {
    require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
  } catch (e) {
    // dotenv not available, will use process.env or defaults
  }
  
  // Run migration
  createAdmin();
}
