// src/hooks/useAuth.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const checkAdminStatus = async (user) => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('useAuth: Could not fetch user profile:', error.message);
        setIsAdmin(false);
      } else {
        console.log('useAuth: User profile found, role:', profile?.role);
        setIsAdmin(profile?.role === 'admin');
      }
    } catch (profileError) {
      console.warn('useAuth: Profile check failed:', profileError);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          await checkAdminStatus(session.user);
        }
      } catch (error) {
        console.log('useAuth: Auth session missing, treating as no session');
        setSession(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        
        if (session?.user) {
          await checkAdminStatus(session.user);
        } else {
          setIsAdmin(false);
        }
        
        if (event === 'SIGNED_IN') {
          // Force a hard navigation to ensure middleware picks up the session
          window.location.href = '/';
        } else if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    loading,
    signOut,
    user: session?.user || null,
    isAdmin
  };
}