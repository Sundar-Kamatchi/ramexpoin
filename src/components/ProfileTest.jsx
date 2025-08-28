// src/components/ProfileTest.jsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthProvider';

export default function ProfileTest() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testProfileQuery = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }

    setLoading(true);
    setError(null);

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
      setError('Query timed out - likely RLS policy issue');
    }, 10000); // 10 second timeout

    try {
      console.log('ProfileTest: Testing profile query for user ID:', user.id);
      
      // Test 1: Check if we can access the table at all
      console.log('ProfileTest: Testing basic table access...');
      const { data: allProfiles, error: allError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      console.log('ProfileTest: Basic table access result:', { allProfiles, allError });

      // Test 2: Direct query with timeout
      console.log('ProfileTest: Testing direct query...');
      const { data: directProfile, error: directError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log('ProfileTest: Direct query result:', { directProfile, directError });

      // Test 3: Check if user exists in auth.users
      console.log('ProfileTest: Testing auth user...');
      const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();
      console.log('ProfileTest: Auth user check:', { authUser, authUserError });

      // Test 4: Try a different approach - check if the user ID exists
      console.log('ProfileTest: Testing user ID existence...');
      const { data: userCheck, error: userCheckError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id);
      
      console.log('ProfileTest: User ID check result:', { userCheck, userCheckError });

      clearTimeout(timeout);
      setProfileData({
        allProfiles,
        allError,
        directProfile,
        directError,
        authUser,
        authUserError,
        userCheck,
        userCheckError
      });

    } catch (err) {
      console.error('ProfileTest: Error during test:', err);
      setError(err.message);
      clearTimeout(timeout);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-blue-900 text-white p-4 rounded-lg text-xs z-50 max-w-md">
      <h3 className="font-bold mb-2">Profile Test</h3>
      <button 
        onClick={testProfileQuery}
        disabled={loading}
        className="bg-blue-600 px-2 py-1 rounded text-xs mb-2"
      >
        {loading ? 'Testing...' : 'Test Profile Query'}
      </button>
      
      {error && (
        <div className="text-red-300 mb-2">
          Error: {error}
        </div>
      )}
      
      {profileData && (
        <div className="space-y-2">
          <div>
            <strong>Basic Table Access:</strong>
            <pre className="text-xs mt-1">
              {JSON.stringify({ allProfiles: profileData.allProfiles, allError: profileData.allError }, null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Direct Profile:</strong>
            <pre className="text-xs mt-1">
              {JSON.stringify(profileData.directProfile, null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Direct Error:</strong>
            <pre className="text-xs mt-1">
              {JSON.stringify(profileData.directError, null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>User ID Check:</strong>
            <pre className="text-xs mt-1">
              {JSON.stringify({ userCheck: profileData.userCheck, userCheckError: profileData.userCheckError }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 