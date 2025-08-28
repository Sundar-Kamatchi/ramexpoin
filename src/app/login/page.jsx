"use client";
import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginModal from '@/components/LoginModal';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLogout = searchParams.get('logout') === 'true';

  useEffect(() => {
    // Redirect to home if user is authenticated
    if (!loading && user) {
      // Clear the logout parameter from URL after successful login
      const url = new URL(window.location.href);
      url.searchParams.delete('logout');
      window.history.replaceState({}, '', url.toString());
      
      router.replace('/');
    }
  }, [user, loading, router]);

  // Show loading state during logout process
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Don't render anything if user is authenticated
  if (user) {
    return null;
  }

  return <LoginModal />;
}