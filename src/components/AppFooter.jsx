// nextjs-app/app/components/AppFooter.tsx
'use client'; // Can be a client component if it needs interactivity, otherwise optional

import React from 'react';
import Image from 'next/image';

export default function AppFooter() {
    return (
        <footer className="
            w-full bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-700
            flex justify-end items-center rounded-b px-2 py-2
            fixed bottom-0 left-0 z-50 app-footer
        ">
            <div className="text-xs md:text-small font-sm text-green-900 dark:text-green-100">
                &copy; 2025 developed by
            </div>
            <img
                src="/icon.ico"
                alt="Developer Logo"
                width="24"
                height="24"
                className="rounded-sm ml-1 object-contain bg-white"
            />
            <span className="text-xs md:text-small font-bold text-green-900 dark:text-green-100 ml-1">Apps S Technologies</span>
        </footer>
    );
}