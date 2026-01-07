import mongoose from 'mongoose';
import Admin from '../models/Admin';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/opinionhub';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = process.argv[2] || 'admin@opinionhub.com';
    const password = process.argv[3] || 'admin123';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin with email ${email} already exists.`);
      process.exit(0);
    }

    // Create admin
    const admin = await Admin.create({ email, password });
    console.log(`Admin created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\n⚠️  Please change the default password after first login!');

    process.exit(0);
  } catch (error: any) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();

