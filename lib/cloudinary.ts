import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary only if credentials are available
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload a file buffer to Cloudinary
 * @param buffer - File buffer
 * @param folder - Folder path in Cloudinary (e.g., 'opinionhub/polls' or 'opinionhub/categories')
 * @param publicId - Optional public ID for the image
 * @returns Promise with the uploaded image URL
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'opinionhub',
  publicId?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );

    // Convert buffer to stream
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Upload a file from a file path (for migration)
 * @param filePath - Local file path
 * @param folder - Folder path in Cloudinary
 * @returns Promise with the uploaded image URL
 */
export async function uploadFileToCloudinary(
  filePath: string,
  folder: string = 'opinionhub'
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder,
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );
  });
}

/**
 * Delete an image from Cloudinary by URL
 * @param imageUrl - Cloudinary image URL
 * @returns Promise<boolean> - true if deleted successfully
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<boolean> {
  try {
    // Extract public_id from Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex((part) => part === 'upload');
    
    if (uploadIndex === -1) {
      // Not a Cloudinary URL, skip deletion
      return false;
    }

    // Get the public_id (everything after 'upload' and version)
    const afterUpload = urlParts.slice(uploadIndex + 1);
    const versionAndId = afterUpload.join('/');
    const publicId = versionAndId.split('.')[0]; // Remove file extension

    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

