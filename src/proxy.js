import { NextResponse } from 'next/server';

export function middleware(request) {
  const hasSession = request.cookies.getAll().some(
    cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (!hasSession && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (hasSession && isPublicRoute) {
    const isLogout = request.nextUrl.searchParams.get('logout') === 'true';
    if (!isLogout) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
