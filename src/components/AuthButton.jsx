//src/app/components/AuthButton.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from './LoginModal';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { KeySquare, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const AuthButton = () => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { user, loading, signOut } = useAuth();
    const router = useRouter();

    console.log('AuthButton: Current state - User:', user?.email, 'Loading:', loading, 'LoggingOut:', isLoggingOut);

        const handleLogout = async () => {
        try {
            console.log('AuthButton: Initiating logout');
            setIsLoggingOut(true);
            
            // Add a timeout to force logout if process takes too long
            const logoutTimeout = setTimeout(() => {
                console.log('AuthButton: Logout timeout - forcing redirect');
                window.location.replace('/login?logout=true');
            }, 5000); // 5 second timeout
            
            // Step 1: Clear Supabase session with multiple attempts
            console.log('AuthButton: Clearing Supabase session...');
            
            // Try multiple logout approaches with individual error handling
            try {
                await supabase.auth.signOut();
                console.log('AuthButton: First signOut attempt successful');
            } catch (e) {
                console.log('AuthButton: First signOut attempt failed:', e);
            }
            
            try {
                await supabase.auth.signOut({ scope: 'local' });
                console.log('AuthButton: Local signOut attempt successful');
            } catch (e) {
                console.log('AuthButton: Local signOut attempt failed:', e);
            }
            
            try {
                await supabase.auth.signOut({ scope: 'global' });
                console.log('AuthButton: Global signOut attempt successful');
            } catch (e) {
                console.log('AuthButton: Global signOut attempt failed:', e);
            }
            
            // Step 2: Force clear all auth-related storage
            console.log('AuthButton: Clearing all auth storage...');
            
            // Clear all localStorage (more aggressive)
            localStorage.clear();
            
            // Clear sessionStorage
            sessionStorage.clear();
            
            // Clear cookies manually
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // Step 3: Verify session is cleared
            let attempts = 0;
            const maxAttempts = 5;
            
            while (attempts < maxAttempts) {
                let session = null;
                try {
                    const { data: { session: sessionData } } = await supabase.auth.getSession();
                    session = sessionData;
                } catch (error) {
                    console.log('AuthButton: Auth session missing during logout verification');
                    session = null;
                }
                
                console.log(`AuthButton: Session check attempt ${attempts + 1}:`, session);
                
                if (!session) {
                    console.log('AuthButton: Session successfully cleared');
                    break;
                }
                
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            // Step 4: Force redirect to login page
            console.log('AuthButton: Redirecting to login page');
            
            // Immediate redirect without delay
            console.log('AuthButton: Attempting redirect to login page');
            window.location.href = '/login?logout=true';
            
            // Fallback: if redirect doesn't work within 1 second, show login modal
            setTimeout(() => {
                if (window.location.pathname !== '/login') {
                    console.log('AuthButton: Redirect failed, showing login modal');
                    setShowLoginModal(true);
                }
            }, 1000);

        } catch (error) {
            console.error('AuthButton: Error during logout:', error);
            
            // Emergency cleanup and refresh
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (storageError) {
                console.error('AuthButton: Error clearing storage:', storageError);
            }
            
            // Force redirect to login page regardless of errors
            window.location.href = '/login?logout=true';
        } finally {
            // Reset logging out state if redirect doesn't happen
            setTimeout(() => {
                console.log('AuthButton: Resetting logout state');
                setIsLoggingOut(false);
            }, 2000);
        }
    };
    
         // Show LoginModal when user becomes null after logout
     useEffect(() => {
         console.log('AuthButton: useEffect - User:', user?.email, 'Loading:', loading, 'LoggingOut:', isLoggingOut);
         
         // Don't show login modal while logging out
         if (isLoggingOut) {
             setShowLoginModal(false);
             return;
         }
         
         // Show login modal if user is not authenticated and not loading
         if (!loading && !user) {
             console.log('AuthButton: Showing login modal');
             setShowLoginModal(true);
         } else {
             console.log('AuthButton: Hiding login modal');
             setShowLoginModal(false);
         }
     }, [user, loading, isLoggingOut]);

    // Determine button text, action, and styling based on current auth state
    let buttonText = 'Login';
    let buttonAction = () => {
        console.log('AuthButton: Login clicked');
        setShowLoginModal(true);
    };
    let buttonIcon = <KeySquare />;

    if (loading || isLoggingOut) {
        buttonText = isLoggingOut ? 'Logging out...' : 'Loading...';
        buttonAction = () => {};
        buttonIcon = <KeySquare />;
        console.log('AuthButton: Showing loading state');
    } else if (user) {
        buttonText = `Logout (${user.email || 'User'})`;
        buttonAction = handleLogout;
        buttonIcon = <LogOut />;
        console.log('AuthButton: Showing logout state for user:', user.email);
    } else {
        console.log('AuthButton: Showing login state');
    }

    return (
        <>
            <Button
                variant="primary"
                onClick={buttonAction}
                size="sm"
                disabled={loading || isLoggingOut}
                className="auth-button-component"
            >
                {buttonIcon}
                <span className="ml-2">{buttonText}</span>
            </Button>

            {showLoginModal && (
                <LoginModal
                    onClose={() => setShowLoginModal(false)}
                />
            )}
        </>
    );
};

export default AuthButton;