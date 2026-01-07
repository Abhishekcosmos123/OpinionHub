/**
 * Model Registry - Ensures all models are registered before use
 * This is critical for serverless environments like Vercel
 * 
 * IMPORTANT: Import order matters!
 * - Admin (no dependencies)
 * - Category (no dependencies) 
 * - Poll (depends on Category)
 * - Vote (depends on Poll)
 * - OTP (no dependencies)
 */

// Import models in dependency order to ensure proper registration
import '@/models/Admin';
import '@/models/Category';  // Must be imported before Poll
import '@/models/Poll';      // Depends on Category
import '@/models/Vote';      // Depends on Poll
import '@/models/OTP';

// Re-export for convenience
export { default as Admin } from '@/models/Admin';
export { default as Category } from '@/models/Category';
export { default as Poll } from '@/models/Poll';
export { default as Vote } from '@/models/Vote';
export { default as OTP } from '@/models/OTP';

