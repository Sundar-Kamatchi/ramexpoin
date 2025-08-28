// app/components/providers/ThemeProvider.jsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Initial state for the context (no explicit type definitions here for pure JS/JSX)
const initialState = {
  theme: 'system', // Default to system for initial state
  setTheme: () => null,
  toggleTheme: () => null,
  resolvedTheme: null, // Initially null until resolved
};

const ThemeProviderContext = createContext(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system', // Default to 'system' if not provided
  storageKey = 'vite-ui-theme', // Default storage key
  enableSystem = true, // Enable system theme by default
  ...props // Catch any other props passed to the provider
}) {
  const [theme, setThemeState] = useState(() => {
    // Initialize theme state with defaultTheme.
    // The actual theme will be set in useEffect after mount.
    return defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Effect to handle initial mount and retrieve theme from storage/system
  useEffect(() => {
    setMounted(true);

    const storedTheme = localStorage.getItem(storageKey);

    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setThemeState(storedTheme);
    } else if (enableSystem) {
      // If enableSystem is true and no stored theme, use system preference
      setThemeState('system');
    } else {
      // Otherwise, use the defaultTheme (which could be 'light' or 'dark')
      setThemeState(defaultTheme);
    }
  }, [storageKey, enableSystem, defaultTheme]); // Add defaultTheme to dependencies

  // Effect to apply the resolved theme to the document element
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    let newResolvedTheme;

    if (theme === 'system' && enableSystem) {
      newResolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else if (theme === 'light' || theme === 'dark') {
      newResolvedTheme = theme;
    } else {
        // Fallback if theme is somehow an unexpected value
        newResolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Update resolvedTheme state
    setResolvedTheme(newResolvedTheme);

    // Remove both classes first
    root.classList.remove('light', 'dark');

    // Add the resolved theme class
    root.classList.add(newResolvedTheme);

    // Set color scheme
    root.style.colorScheme = newResolvedTheme;

    console.log('Theme applied:', newResolvedTheme); // Debug log
  }, [theme, mounted, enableSystem]); // Add enableSystem to dependencies

  // Function to set the theme, memoized for stability
  const setTheme = useCallback((newTheme) => {
    console.log('Setting theme to:', newTheme); // Debug log
    if (mounted) { // Only interact with localStorage if mounted
        localStorage.setItem(storageKey, newTheme);
    }
    setThemeState(newTheme);
  }, [mounted, storageKey]);

  // Function to toggle the theme, memoized for stability
  const toggleTheme = useCallback(() => {
    let newTheme;
    if (resolvedTheme === 'light') {
      newTheme = 'dark';
    } else if (resolvedTheme === 'dark') {
      newTheme = 'light';
    } else {
      // If resolvedTheme is null or theme is 'system', toggle between light/dark based on current theme state.
      newTheme = theme === 'light' ? 'dark' : 'light';
    }
    console.log('Toggling theme from', theme, 'to', newTheme); // Debug log
    setTheme(newTheme);
  }, [theme, resolvedTheme, setTheme]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
    resolvedTheme, // Expose the resolved theme
  };

  if (!mounted) return null;
  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};