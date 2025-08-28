// src/app/masters/page.jsx

'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const masterSections = [
  { name: 'Suppliers', href: '/masters/suppliers', description: 'Manage supplier information and contacts.', color: 'blue' },
  { name: 'Customers', href: '/masters/customers', description: 'Manage customer details and history.', color: 'green' },
  { name: 'Items', href: '/masters/items', description: 'Manage product and item master data.', color: 'purple' },
  { name: 'Gap Items', href: '/masters/gap-items', description: 'Manage gap item specifics.', color: 'orange' },
  { name: 'Sieve Sizes', href: '/masters/sieve-sizes', description: 'Manage available sieve sizes.', color: 'indigo' },
];

const colorClasses = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600',
  green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600',
  purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600',
  orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600',
};

export default function MastersPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 mt-20">
      <div className="mb-8 flex flex-row justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Masters</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Select a category to manage your master data.
        </p>
        <Link href="/">
          <Button variant="primary">Home</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {masterSections.map((section) => (
          <Link href={section.href} key={section.name} passHref>
            <div className={`group block p-6 border-2 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 ${colorClasses[section.color]}`}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{section.name}</h2>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors" />
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

