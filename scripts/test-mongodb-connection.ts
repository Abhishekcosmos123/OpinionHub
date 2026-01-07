import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env.local');
  process.exit(1);
}

// Mask password in connection string for display
const maskedURI = MONGODB_URI.replace(/:[^:@]+@/, ':****@');

async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    console.log('📍 Connection string:', maskedURI);
    console.log('');
    
    await mongoose.connect(MONGODB_URI!, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connection successful!');
    console.log('📊 Database:', mongoose.connection.db?.databaseName);
    console.log('🔗 Host:', mongoose.connection.host);
    
    // Test a simple query
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log('📁 Collections:', collections?.map(c => c.name).join(', ') || 'None');
    
    await mongoose.connection.close();
    console.log('');
    console.log('✅ All tests passed! Your MongoDB connection is working correctly.');
    process.exit(0);
  } catch (error: any) {
    console.error('');
    console.error('❌ Connection failed!');
    console.error('');
    console.error('Error details:');
    console.error('  Message:', error.message);
    console.error('');
    
    // Provide helpful error messages
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.error('🔍 Authentication Error - Possible causes:');
      console.error('  1. Wrong username or password');
      console.error('  2. Password contains special characters that need URL encoding');
      console.error('  3. User doesn\'t exist or has wrong permissions');
      console.error('');
      console.error('💡 Solutions:');
      console.error('  - Check username and password in MongoDB Atlas → Database Access');
      console.error('  - URL-encode password if it contains: @ # $ % & + = ? / or spaces');
      console.error('  - Verify user has "Read and write to any database" privileges');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('🔍 Network Error - Possible causes:');
      console.error('  1. Cluster hostname is incorrect');
      console.error('  2. Internet connection issue');
      console.error('  3. Cluster is paused');
    } else if (error.message.includes('timeout')) {
      console.error('🔍 Timeout Error - Possible causes:');
      console.error('  1. Network Access not configured (IP not whitelisted)');
      console.error('  2. Firewall blocking connection');
      console.error('  3. Cluster is paused or unavailable');
      console.error('');
      console.error('💡 Solutions:');
      console.error('  - Go to MongoDB Atlas → Network Access');
      console.error('  - Add IP address: 0.0.0.0/0 (for development)');
      console.error('  - Check if cluster is running');
    } else if (error.message.includes('Invalid connection string')) {
      console.error('🔍 Connection String Error - Possible causes:');
      console.error('  1. Missing database name (should include /opinionhub)');
      console.error('  2. Invalid format');
      console.error('  3. Special characters not URL-encoded');
      console.error('');
      console.error('💡 Correct format:');
      console.error('  mongodb+srv://username:password@cluster.mongodb.net/opinionhub?retryWrites=true&w=majority');
    }
    
    console.error('');
    console.error('📖 See FIX_MONGODB_CONNECTION.md for detailed troubleshooting');
    process.exit(1);
  }
}

testConnection();

