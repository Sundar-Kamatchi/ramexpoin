'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { 
  Home, 
  Users, 
  Menu,
  X,
  Calculator,
  FileText,
  ClipboardList
} from 'lucide-react';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { isAdmin } = useAuth();

  console.log('Sidebar: isAdmin =', isAdmin, 'isOpen =', isOpen);

  const menuItems = [
    { href: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
  ];

  // Add admin-only menu items
  if (isAdmin) {
    menuItems.push({ href: '/user-management', label: 'User Management', icon: <Users className="w-5 h-5" /> });
    menuItems.push({ href: '/gqr-working', label: 'GQR Working', icon: <Calculator className="w-5 h-5" /> });
  }

  return (
    <>
      {/* Mobile menu button - always visible */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Navigation</h2>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      // Close sidebar on mobile after clicking a link
                      toggleSidebar();
                    }}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isAdmin ? 'Admin Access' : 'User Access'}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
