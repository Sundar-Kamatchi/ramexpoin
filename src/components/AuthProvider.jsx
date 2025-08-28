// app/components/authprovider.jsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

// 1. Create the Auth Context
const AuthContext = createContext({
  user: null,
  isAdmin: false,
  loading: true,
});

// 2. Create the AuthProvider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    let authStateChangeHandled = false; // Track if auth state change has been handled
    
    console.log('AuthProvider: useEffect started');
    console.log('AuthProvider: About to call getInitialSession');
    
    // Add a timeout to prevent infinite loading - increased to 10 seconds
    const loadingTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('AuthProvider: Loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 10000); // Increased to 10 seconds for better reliability

    // This function runs once to get the initial session
    const getInitialSession = async () => {
      console.log('AuthProvider: getInitialSession function called');
      try {
        try {
          console.log('AuthProvider: Getting initial session...');
          
          // Wrap the getUser call in a try-catch to handle AuthSessionMissingError
          let initialUser = null;
          let sessionError = null;
          
          try {
            const { data: { user }, error } = await supabase.auth.getUser();
            initialUser = user;
            sessionError = error;
          } catch (authError) {
            console.log('AuthProvider: Auth session missing, this is normal for unauthenticated users');
            sessionError = authError;
          }
          
          if (!isMounted) {
            console.log('AuthProvider: Component unmounted during initial session check');
            return;
          }
          
          if (sessionError) {
            console.log('AuthProvider: Session error:', sessionError.message);
            setUser(null);
            setIsAdmin(false);
          } else if (initialUser) {
            console.log('AuthProvider: Initial user found:', initialUser.email, 'ID:', initialUser.id);
            setUser(initialUser);
            
            // Check user profile for admin status
            try {
              console.log('AuthProvider: Starting profile query for user ID:', initialUser.id);
              const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', initialUser.id)
                .single();
              
              if (!isMounted) {
                console.log('AuthProvider: Component unmounted during initial profile check');
                return;
              }
              
              if (error) {
                console.warn("AuthProvider: Could not fetch user profile:", error.message);
                setIsAdmin(false);
              } else {
                console.log("AuthProvider: User profile found, role:", profile?.role);
                setIsAdmin(profile?.role === 'admin');
              }
            } catch (profileError) {
              console.warn("AuthProvider: Profile check failed:", profileError);
              setIsAdmin(false);
            }
          } else {
            console.log('AuthProvider: No initial user found');
            setUser(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('AuthProvider: Error getting initial session:', error);
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("AuthProvider: Error getting initial user session:", error);
        // Handle AuthSessionMissingError specifically
        if (error.message && error.message.includes('Auth session missing')) {
          console.log('AuthProvider: Auth session missing, this is normal for unauthenticated users');
        }
      } finally {
        // This is crucial: it runs regardless of success or failure
        if (isMounted) {
          console.log('AuthProvider: Setting loading to false after initial session check');
          setLoading(false);
          authStateChangeHandled = true;
        }
      }
    };

    getInitialSession();

    // This listener handles future logins and logouts
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, session?.user?.email);
        
        if (!isMounted) {
          console.log('AuthProvider: Component unmounted during auth state change');
          return;
        }
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          try {
            console.log('AuthProvider: Checking user profile on auth change for ID:', currentUser.id);
            
            // Add a timeout to prevent hanging
            const profileQueryPromise = supabase
              .from('user_profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();
            
            // Add a 3-second timeout
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile query timeout')), 3000);
            });
            
            try {
              const { data: profile, error } = await Promise.race([profileQueryPromise, timeoutPromise]);
              
              if (!isMounted) {
                console.log('AuthProvider: Component unmounted during auth change profile check');
                return;
              }
              
              if (error) {
                console.warn("AuthProvider: Could not fetch user profile on auth change:", error.message);
                // Try to create profile if it doesn't exist
                try {
                  console.log('AuthProvider: Creating user profile on auth change...');
                  const { error: insertError } = await supabase
                    .from('user_profiles')
                    .insert({
                      id: currentUser.id,
                      email: currentUser.email,
                      full_name: currentUser.user_metadata?.full_name || currentUser.email,
                      role: 'staff'
                    });
                  
                  if (insertError) {
                    console.error("AuthProvider: Failed to create user profile on auth change:", insertError.message);
                  } else {
                    console.log("AuthProvider: Created user profile on auth change");
                  }
                } catch (insertErr) {
                  console.error("AuthProvider: Error creating user profile on auth change:", insertErr);
                }
                setIsAdmin(false);
              } else {
                console.log("AuthProvider: User profile found, role:", profile?.role);
                setIsAdmin(profile?.role === 'admin');
              }
            } catch (timeoutError) {
              console.warn("AuthProvider: Profile query timed out on auth change:", timeoutError.message);
              
              // Fallback: Set admin based on email for now
              const isAdminUser = currentUser.email === 'admin@ramexpo.com';
              console.log('AuthProvider: FALLBACK - Setting isAdmin based on email:', isAdminUser);
              setIsAdmin(isAdminUser);
            }
          } catch (profileError) {
            console.warn("AuthProvider: Profile check failed on auth change:", profileError);
            setIsAdmin(false);
          }
        } else {
          console.log("AuthProvider: No user in session, setting isAdmin to false");
          setIsAdmin(false);
        }
        
        // Ensure loading is false after any auth event
        if (isMounted) {
          console.log('AuthProvider: Setting loading to false after auth change');
          setLoading(false);
          authStateChangeHandled = true;
        }
      }
    );

    // Cleanup the listener when the component unmounts
    return () => {
      console.log('AuthProvider: Cleaning up useEffect');
      isMounted = false;
      clearTimeout(loadingTimeout);
      authListener.subscription.unsubscribe();
    };
  }, []); // Removed loading dependency to prevent infinite re-renders

  const value = {
    user,
    isAdmin,
    loading,
  };

  console.log('AuthProvider: Current state - user:', user?.email, 'isAdmin:', isAdmin, 'loading:', loading);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 3. Create the custom hook to use the context easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};