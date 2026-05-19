import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check if the request is for the root URL ("/")
  if (request.nextUrl.pathname === '/') {
    // Rewrite the request to the login page
    return NextResponse.rewrite(new URL('/login', request.url));
  }

  // Continue to the next middleware or the page
  return NextResponse.next();
}
