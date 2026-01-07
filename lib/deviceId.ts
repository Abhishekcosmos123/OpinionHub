/**
 * Generate or retrieve a unique device ID
 * Uses localStorage to persist the device ID across sessions
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    // Server-side: return a placeholder (shouldn't happen in client components)
    return 'server-side';
  }

  const STORAGE_KEY = 'opinionhub_device_id';
  
  // Try to get existing device ID
  let deviceId = localStorage.getItem(STORAGE_KEY);
  
  if (!deviceId) {
    // Generate a new device ID
    // Format: timestamp-randomstring
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    deviceId = `${timestamp}-${randomStr}`;
    
    // Store it in localStorage
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  
  return deviceId;
}

