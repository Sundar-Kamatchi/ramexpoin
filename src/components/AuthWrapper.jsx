// components/AuthWrapper.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import supabase from '../lib/supabaseClient';

export default function AuthWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!supabase) {
      console.error("Supabase client not initialized. Check your environment variables and lib/supabaseClient.js.");
      setLoading(false);
      if (pathname !== '/') {
        router.push('/');
      }
      return;
    }

    const checkAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error || !currentSession) {
          setSession(null);
          if (pathname !== '/') {
            router.push('/');
          }
        } else {
          setSession(currentSession);
        }
      } catch (authError) {
        console.log('AuthWrapper: Auth session missing, treating as no session');
        setSession(null);
        if (pathname !== '/') {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession && pathname !== '/') {
        router.push('/');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, pathname]);

  const isProtectedRoute = pathname !== '/';

  if (loading && isProtectedRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl">Loading application...</p>
      </div>
    );
  }

  if (isProtectedRoute && !session) {
    return null;
  }

  return children;
}