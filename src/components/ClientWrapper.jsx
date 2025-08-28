// components/clientwrapper.jsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/sidebar';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/components/SidebarProvider';

export default function ClientWrapper({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Redirect will happen from useEffect
  }

  return (
    <div className="flex flex-1 relative">
      {/* Sidebar - show only for admin users */}
      {isAdmin && !loading && (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      )}
      
      {/* Main content area */}
      <div className="flex-1 transition-all duration-300">
        <main className="p-4 min-h-full">
          {children}
        </main>
      </div>
    </div>
  );
}