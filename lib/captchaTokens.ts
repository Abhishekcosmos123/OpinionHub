// Shared token storage for CAPTCHA verification
// In production, use Redis or similar for distributed systems

const TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Use global to ensure singleton across Next.js hot reloads
declare global {
  var captchaTokens: Map<string, number> | undefined;
  var captchaTokensCleanup: boolean | undefined;
}

// Initialize or reuse the global Map
let validTokens: Map<string, number>;

if (typeof global !== 'undefined') {
  if (!global.captchaTokens) {
    global.captchaTokens = new Map<string, number>();
  }
  validTokens = global.captchaTokens;
} else {
  // Fallback for non-Node environments (shouldn't happen in API routes)
  validTokens = new Map<string, number>();
}

// Clean up expired tokens periodically (only set up once)
if (typeof setInterval !== 'undefined' && typeof global !== 'undefined' && !global.captchaTokensCleanup) {
  global.captchaTokensCleanup = true;
  setInterval(() => {
    const now = Date.now();
    for (const [token, expiry] of validTokens.entries()) {
      if (now > expiry) {
        validTokens.delete(token);
      }
    }
  }, 60000); // Clean up every minute
}

// Export validTokens for debugging (read-only access)
export { validTokens };

export function storeToken(token: string): void {
  const expiry = Date.now() + TOKEN_EXPIRY;
  validTokens.set(token, expiry);
}

export function verifyToken(token: string): boolean {
  const expiry = validTokens.get(token);
  if (!expiry) {
    return false;
  }

  const now = Date.now();
  if (now > expiry) {
    validTokens.delete(token);
    return false;
  }

  // Token is valid - mark it as used and remove it
  validTokens.delete(token);
  return true;
}

