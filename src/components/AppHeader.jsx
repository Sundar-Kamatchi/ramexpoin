// nextjs-app/app/components/AppHeader.tsx
'use client'; // This component needs to be a Client Component because it uses AuthButton

import React from 'react';
import AuthButton from './AuthButton'; // Import the AuthButton component
import { Moon, Menu } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { Sun } from "lucide-react";
import { useTheme } from './providers/ThemeProvider';
import { Button } from "./ui/button";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useSidebar } from '@/components/SidebarProvider';

export default function AppHeader() {
    const { theme, setTheme } = useTheme();
    const { isAdmin, user, loading } = useAuth();
    const { toggleSidebar } = useSidebar();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="p-4 bg-yellow-100 text-yellow-800">Loading theme debug...</div>;
    }

    console.log('AppHeader: isAdmin =', isAdmin, 'user =', user?.email, 'loading =', loading);

    return (
        <header className="
            w-full bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-700 py-2 px-6 
            flex justify-between items-center
            fixed top-0 left-0 z-[1000] app-header
        ">
            <div className="flex items-center">
                {/* Option 1: Fix the Next.js Image component */}
                <div className="relative w-[70px] h-[70px] mr-3">
                    <Link href="/">
                        <Image 
                            src="/ramlogo.png" 
                            alt="Ramasamy Exim Logo" 
                            fill
                            className="rounded-lg object-contain cursor-pointer"
                            sizes="70px"
                            priority
                        />

                    </Link>
                </div>
                
                {/* Option 2: Alternative using regular img tag (uncomment if Image still doesn't work)
                <img 
                    src="/ramlogo.png" 
                    alt="Ramasamy Exim Logo" 
                    width={70} 
                    height={70} 
                    className="rounded-lg mr-3 object-contain" 
                />
                */}
                
                <div>
                    <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent border-transparent">
                        Ramasamy Export & Import Private Ltd
                    </h1>
                    <p className="text-sm md:text-base text-green-600 dark:text-green-400 font-semibold">
                        Onion Export Management
                    </p>
                </div>
            </div>
            <div className='flex items-center space-x-4'>
                {/* Desktop menu button for admins only */}
                {isAdmin && !loading && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="flex"
                        onClick={toggleSidebar}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                )}
                
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="primary" size="icon">
                            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")} className={theme === "light" ? "font-bold" : ""}>
                            Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            Dark
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                {/* AuthButton component handles login/logout and modal */}
                <AuthButton />
            </div>
        </header>
    );
}