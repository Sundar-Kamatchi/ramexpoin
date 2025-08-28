// src/components/AuthDebug.jsx
'use client';

import { useAuth } from './AuthProvider';

export default function AuthDebug() {
  const { user, isAdmin, loading } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div>User: {user?.email || 'None'}</div>
      <div>Admin: {isAdmin ? 'Yes' : 'No'}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User ID: {user?.id || 'None'}</div>
    </div>
  );
} 