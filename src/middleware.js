// src/middleware.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  let session = null;
  try {
    const { data: { session: sessionData } } = await supabase.auth.getSession();
    session = sessionData;
  } catch (error) {
    console.log('Middleware: Auth session missing, redirecting to login');
    // If there's an auth error, treat as no session
    session = null;
  }

  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Allow authenticated users to stay on login page during logout process
  if (session && isPublicRoute) {
    // Only redirect if this is not a logout redirect
    const isLogout = request.nextUrl.searchParams.get('logout') === 'true';
    if (!isLogout) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};