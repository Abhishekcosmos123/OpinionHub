import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow public API routes
  if (request.nextUrl.pathname.startsWith('/api/categories') ||
      request.nextUrl.pathname.startsWith('/api/polls')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*',
  ],
};

