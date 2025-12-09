/**
 * Create Admin User Script
 *
 * Creates an admin user for testing the admin dashboard
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Simple User model (since we don't have the full model yet)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@mariachiWeb.com' });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('📧 Email:', existingAdmin.email);
      console.log('🔐 Use password: admin123 to login');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await User.create({
      email: 'admin@mariachiWeb.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('  ADMIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:    admin@mariachiWeb.com');
    console.log('🔐 Password: admin123');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password in production!');
    console.log('');
    console.log('🚀 You can now login at: http://localhost:3002/admin/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();
