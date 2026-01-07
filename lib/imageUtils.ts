/**
 * Utility functions for handling image URLs
 * Supports both Cloudinary URLs and local storage URLs
 */

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * Check if a URL is a local storage URL
 */
export function isLocalUrl(url: string): boolean {
  return url.startsWith('/uploads/') || url.startsWith('/public/uploads/');
}

/**
 * Get the full image URL
 * Handles both Cloudinary URLs (already full) and local URLs (needs domain)
 */
export function getImageUrl(url: string): string {
  if (!url) return '';
  
  // If it's already a full URL (Cloudinary or external), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a local URL, return as-is (Next.js will handle it)
  if (url.startsWith('/')) {
    return url;
  }
  
  // Fallback: return as-is
  return url;
}

/**
 * Get optimized Cloudinary image URL with transformations
 * @param url - Cloudinary URL
 * @param width - Desired width
 * @param height - Desired height
 * @param quality - Image quality (default: auto)
 * @param format - Image format (default: auto)
 */
export function getOptimizedCloudinaryUrl(
  url: string,
  width?: number,
  height?: number,
  quality: string | number = 'auto',
  format: string = 'auto'
): string {
  if (!isCloudinaryUrl(url)) {
    return url; // Return as-is if not Cloudinary
  }

  // Parse Cloudinary URL
  // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
  const urlParts = url.split('/upload/');
  
  if (urlParts.length !== 2) {
    return url; // Invalid Cloudinary URL format
  }

  const [baseUrl, rest] = urlParts;
  
  // Build transformation string
  const transformations: string[] = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  
  const transformationString = transformations.length > 0 
    ? `${transformations.join(',')}/` 
    : '';
  
  return `${baseUrl}/upload/${transformationString}${rest}`;
}

