// app/components/ThemeDebug.tsx
'use client';

import { useTheme } from './providers/ThemeProvider';
import { useState, useEffect } from 'react';

export default function ThemeDebug() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-4 bg-yellow-100 text-yellow-800">Loading theme debug...</div>;
  }

  return (
    <div className="fixed bottom-4 left-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
      <div className="text-sm space-y-2">
        <div>Current Theme: <strong>{theme}</strong></div>
        <div className="flex space-x-2">
          <button
            onClick={() => setTheme('light')}
            className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded text-xs"
          >
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className="px-3 py-1 bg-gray-700 text-gray-100 rounded text-xs"
          >
            Dark
          </button>
          <button
            onClick={toggleTheme}
            className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Toggle
          </button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          HTML class: {typeof window !== 'undefined' ? document.documentElement.className : 'N/A'}
        </div>
      </div>
    </div>
  );
}