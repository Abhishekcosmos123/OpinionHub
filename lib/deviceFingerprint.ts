/**
 * Generate a persistent device fingerprint
 * Uses multiple browser characteristics that are hard to change
 * This fingerprint persists even after clearing cache, localStorage, or using incognito mode
 */

export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  const components: string[] = [];

  // Screen characteristics (hard to change)
  components.push(`screen:${screen.width}x${screen.height}`);
  components.push(`avail:${screen.availWidth}x${screen.availHeight}`);
  components.push(`color:${screen.colorDepth}`);
  components.push(`pixel:${window.devicePixelRatio || 1}`);

  // Timezone (hard to change)
  components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

  // Language (hard to change)
  components.push(`lang:${navigator.language}`);

  // Platform (hard to change)
  components.push(`platform:${navigator.platform}`);

  // Hardware concurrency (CPU cores)
  components.push(`cores:${navigator.hardwareConcurrency || 0}`);

  // Canvas fingerprinting (very hard to change)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Device fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Device fingerprint', 4, 17);
      const canvasHash = canvas.toDataURL().substring(0, 50);
      components.push(`canvas:${canvasHash}`);
    }
  } catch (e) {
    // Canvas fingerprinting failed, continue without it
  }

  // WebGL fingerprinting
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && 'getExtension' in gl && 'getParameter' in gl) {
      const webglContext = gl as WebGLRenderingContext;
      const debugInfo = webglContext.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const vendor = webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        components.push(`webgl:${vendor}-${renderer}`);
      }
      const version = webglContext.getParameter(webglContext.VERSION);
      components.push(`glversion:${version}`);
    }
  } catch (e) {
    // WebGL fingerprinting failed, continue without it
  }

  // User agent (can be changed but still useful)
  components.push(`ua:${navigator.userAgent.substring(0, 50)}`);

  // Combine all components
  const fingerprintString = components.join('|');

  // Create a hash-like string (simple hash for demo)
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to base36 for shorter string - NO TIMESTAMP for persistence
  const fingerprint = Math.abs(hash).toString(36);

  return fingerprint;
}

/**
 * Get or create a persistent device fingerprint
 * Stores in multiple places for redundancy
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  const STORAGE_KEYS = {
    localStorage: 'opinionhub_device_fp',
    sessionStorage: 'opinionhub_device_fp_session',
  };

  // Try to get from localStorage first
  let fingerprint = localStorage.getItem(STORAGE_KEYS.localStorage);
  
  if (fingerprint) {
    // Also store in sessionStorage as backup
    sessionStorage.setItem(STORAGE_KEYS.sessionStorage, fingerprint);
    return fingerprint;
  }

  // Try sessionStorage as fallback
  fingerprint = sessionStorage.getItem(STORAGE_KEYS.sessionStorage);
  
  if (fingerprint) {
    // Restore to localStorage
    localStorage.setItem(STORAGE_KEYS.localStorage, fingerprint);
    return fingerprint;
  }

  // Generate new fingerprint
  fingerprint = generateDeviceFingerprint();
  
  // Store in both places
  localStorage.setItem(STORAGE_KEYS.localStorage, fingerprint);
  sessionStorage.setItem(STORAGE_KEYS.sessionStorage, fingerprint);

  // Also try IndexedDB for additional persistence
  try {
    if ('indexedDB' in window) {
      const request = indexedDB.open('OpinionHubDB', 1);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('deviceFingerprint')) {
          db.createObjectStore('deviceFingerprint');
        }
      };
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['deviceFingerprint'], 'readwrite');
        const store = transaction.objectStore('deviceFingerprint');
        store.put(fingerprint, 'fingerprint');
      };
    }
  } catch (e) {
    // IndexedDB failed, continue without it
  }

  return fingerprint;
}

