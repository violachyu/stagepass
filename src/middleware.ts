import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const stageId = request.nextUrl.searchParams.get('stageId');
  
  const isProtectedRoute = 
    path === '/dashboard' || path.startsWith('/dashboard/') ||
    path === '/create-stage' || path.startsWith('/create-stage/') ||
    path === '/live-room' || path.startsWith('/live-room/') ||
    path === '/user' || path.startsWith('/user/');
    
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard', 
    '/dashboard/:path*',
    '/create-stage', 
    '/create-stage/:path*',
    '/live-room', 
    '/live-room/:path*',
    '/user',
    '/user/:path*'
  ]
}; 