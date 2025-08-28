// src/components/LoginModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import {supabase} from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button} from '@/components/ui/button';

const LoginModal = ({ onClose }) => { 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        if (!supabase) {
            setMessage('Supabase client not initialized. Please refresh.');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setMessage(error.message);
            setLoading(false);
        } else {
            setMessage('Logged in successfully!');
            // The auth state change listener will handle the redirect
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[2000] p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Login </h2>
                <form className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <Input
                            type="email"
                            id="email"
                            className="w-full px-4 py-2   text-red-900"
                            placeholder="your@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 pr-10"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500"
                            style={{ top: '2.25rem' }}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.173.078.292.078.639 0 .931C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.173Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.981 18.004A8.004 8.004 0 0 0 12 20.25c4.638 0 8.573-3.007 9.963-7.173.078-.292.078-.639 0-.931C20.577 7.51 16.64 4.5 12 4.5c-1.155 0-2.26.195-3.26.544M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c1.155 0 2.26.195 3.26.544M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            )}
                        </Button>
                    </div>
                    {message && (
                        <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'} text-center`}>
                            {message}
                        </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Button
                            variant="Link"
                            type="submit"
                            onClick={handleLogin}
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;