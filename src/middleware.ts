import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Izinkan akses jika itu adalah file statis atau images
  if (pathname.includes('.') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // 1. Proteksi Halaman Dashboard
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Cegah user login masuk kembali ke halaman login
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Hanya jalankan middleware pada route dashboard dan login
  matcher: ['/dashboard/:path*', '/login'],
};