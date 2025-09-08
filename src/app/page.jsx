// app/page.tsx

'use client'; // This component needs to be a Client Component for Link interactivity

import React from 'react';
import Link from 'next/link';
import AnimatedDots from '@/components/AnimatedDots';

export default function Home() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background image */}
            <div
              className="absolute inset-0 -z-10 scale-105"
              style={{
                backgroundImage: 'url(/big_onion.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
              }}
            />
            {/* Animated dotted layer */}
            <AnimatedDots className="-z-0" />
            {/* Soft overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40 dark:from-black/60 dark:via-black/40 dark:to-black/60 -z-0" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl relative z-10 px-4">
                {/* Card 1: Manage PO - Blue Theme */}
                <Link href="/po-list" passHref>
                    <div className="bg-blue-50/80 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 border border-blue-200/60 dark:border-blue-700/50 rounded-3xl shadow-lg hover:shadow-2xl shadow-blue-900/10 dark:shadow-blue-900/30 transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center text-center p-7 min-h-[190px] transform hover:-translate-y-1.5 hover:bg-blue-100/70 dark:hover:bg-blue-900/70 backdrop-blur">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 21h4.5M12 3v18" />
                        </svg>
                        <h2 className="text-xl font-semibold mb-1 text-shadow">Manage PO</h2>
                        <p className="text-sm opacity-90 text-shadow-sm">Create, view, and track all your Purchase Orders.</p>
                    </div>
                </Link>

                {/* Card 2: Pre GR - Green Theme */}
                <Link href="/pre-gr-list" passHref>
                    <div className="bg-green-50/80 dark:bg-green-900/60 text-green-900 dark:text-green-100 border border-green-200/60 dark:border-green-700/50 rounded-3xl shadow-lg hover:shadow-2xl shadow-green-900/10 dark:shadow-green-900/30 transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center text-center p-7 min-h-[190px] transform hover:-translate-y-1.5 hover:bg-green-100/70 dark:hover:bg-green-900/70 backdrop-blur">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-green-600 dark:text-green-400 mb-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6.375a2.25 2.25 0 0 0 2.25-2.25V10.375m-9.75 3.375h9.75m-9.75 3V14.25m6.375-5.625a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75ZM20.25 4.5a3.375 3.375 0 1 0 0 6.75 3.375 3.375 0 0 0 0-6.75Z" />
                        </svg>
                        <h2 className="text-xl font-semibold mb-1 text-shadow">Pre GR</h2>
                        <p className="text-sm opacity-90 text-shadow-sm">Record truck unloading and initial segregation details.</p>
                    </div>
                </Link>

                {/* Card 3: GQR - Purple Theme */}
                <Link href="/gqr-list" passHref>
                    <div className="bg-purple-50/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-100 border border-purple-200/60 dark:border-purple-700/50 rounded-3xl shadow-lg hover:shadow-2xl shadow-purple-900/10 dark:shadow-purple-900/30 transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center text-center p-7 min-h-[190px] transform hover:-translate-y-1.5 hover:bg-purple-100/70 dark:hover:bg-purple-900/70 backdrop-blur">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-purple-600 dark:text-purple-400 mb-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m-4.5-6a4.125 4.125 0 1 1 8.25 0m-8.25 0A4.125 4.125 0 0 0 10.5 16.125V21m-2.25-4.5H9M12 18.75V21m-4.5 0H9M12 21h3.75M15 21v-3.75m-2.25-4.5H15M18.75 12h.008v.008h-.008V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <h2 className="text-xl font-semibold mb-1 text-shadow">GQR List</h2>
                        <p className="text-sm opacity-90 text-shadow-sm">Finalize quality reports and settlements.</p>
                    </div>
                </Link>

                {/* Card 4: Reports & Analysis - Orange Theme - TEMPORARILY REMOVED */}
                {/* <Link href="/reports" passHref>
                    <div className="bg-orange-50/80 dark:bg-orange-900/60 text-orange-900 dark:text-orange-100 border border-orange-200/60 dark:border-orange-700/50 rounded-3xl shadow-lg hover:shadow-2xl shadow-orange-900/10 dark:shadow-orange-900/30 transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center text-center p-7 min-h-[190px] transform hover:-translate-y-1.5 hover:bg-orange-100/70 dark:hover:bg-orange-900/70 backdrop-blur">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-orange-600 dark:text-orange-400 mb-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-6.75ZM10.5 12.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v7.5c0 .621-.504 1.125-1.125 1.125h-2.25c-.621 0-1.125-.504-1.125-1.125v-7.5ZM17.25 6.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V6.75Z" />
                        </svg>
                        <h2 className="text-xl font-semibold mb-1 text-shadow">Reports & Analysis</h2>
                        <p className="text-sm opacity-90 text-shadow-sm">Gain insights with yield comparisons and other reports.</p>
                    </div>
                </Link> */}

                {/* Card 5: Masters - Indigo Theme */}
                <Link href="/masters" passHref>
                    <div className="bg-indigo-50/80 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-100 border border-indigo-200/60 dark:border-indigo-700/50 rounded-3xl shadow-lg hover:shadow-2xl shadow-indigo-900/10 dark:shadow-indigo-900/30 transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center text-center p-7 min-h-[190px] transform hover:-translate-y-1.5 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/70 backdrop-blur">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                        </svg>
                        <h2 className="text-xl font-semibold mb-1 text-shadow">Masters</h2>
                        <p className="text-sm opacity-90 text-shadow-sm">Manage suppliers, customers, items, and more.</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}

