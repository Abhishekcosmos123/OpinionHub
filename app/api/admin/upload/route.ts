import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

async function requireAuth(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    throw new Error('Unauthorized');
  }
  return admin;
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'opinionhub'; // Default folder or 'opinionhub/polls', 'opinionhub/categories'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary if configured, otherwise fallback to local storage
    if (isCloudinaryConfigured()) {
      try {
        const cloudinaryUrl = await uploadToCloudinary(buffer, folder);
        return NextResponse.json(
          { success: true, url: cloudinaryUrl, message: 'File uploaded successfully to Cloudinary' },
          { status: 200 }
        );
      } catch (cloudinaryError: any) {
        console.error('Cloudinary upload failed, falling back to local storage:', cloudinaryError);
        // Fall through to local storage
      }
    }

    // Fallback to local storage if Cloudinary is not configured or upload fails
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save to local storage
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json(
      { success: true, url: publicUrl, message: 'File uploaded successfully to local storage' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

