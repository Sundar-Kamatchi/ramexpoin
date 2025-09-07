// Environment variable validation
// This helps catch missing environment variables early

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

// Validate required environment variables
if (typeof window === 'undefined') {
  // Server-side validation
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }

  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
} else {
  // Client-side validation (with console warnings)
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is missing');
  }

  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  }
}

export default env;
