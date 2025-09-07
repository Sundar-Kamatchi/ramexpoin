# Production vs Development Issues - Troubleshooting Guide

## Common Causes of Production vs Development Differences

### 1. **Environment Variables** (Most Common)
**Issue**: Missing or incorrect environment variables in production.

**Solution**: 
- Check Vercel dashboard → Project Settings → Environment Variables
- Ensure these variables are set in production:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```

### 2. **Build Optimization**
**Issue**: Next.js optimizes code differently in production builds.

**Solutions**:
- Check for dynamic imports that might fail in production
- Ensure all imports are properly resolved
- Check for client-side only code that might not work in SSR

### 3. **Supabase Connection Issues**
**Issue**: Different Supabase configurations between environments.

**Solutions**:
- Verify Supabase URL and keys are correct in production
- Check if RLS (Row Level Security) policies are properly configured
- Ensure database functions exist in production

### 4. **Next.js Configuration**
**Issue**: Different behavior due to production optimizations.

**Current Config Issues**:
```javascript
// next.config.mjs
const nextConfig = {
    output: 'standalone'  // This might cause issues with Vercel
};
```

**Recommended Fix**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Remove 'standalone' for Vercel deployment
    // output: 'standalone'  // Comment this out for Vercel
};

export default nextConfig;
```

### 5. **Build Script Differences**
**Issue**: Different build processes between dev and production.

**Current Build Script**:
```json
"vercel-build": "npm install --production=false && next build"
```

**Potential Issues**:
- `--production=false` might install dev dependencies that aren't needed
- Could cause version conflicts

**Recommended Fix**:
```json
"vercel-build": "npm install && next build"
```

## Debugging Steps

### 1. **Check Vercel Logs**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Check deployment logs
vercel logs --prod
```

### 2. **Check Environment Variables**
```bash
# List environment variables in production
vercel env ls --prod
```

### 3. **Test Build Locally**
```bash
# Test production build locally
npm run build
npm start
```

### 4. **Check Browser Console**
- Open production site
- Check browser console for errors
- Compare with development console

## Specific Issues and Solutions

### Issue 1: Supabase Connection Fails
**Symptoms**: 
- "Failed to load GQRs" errors
- Authentication issues
- Database connection errors

**Solutions**:
1. Verify environment variables in Vercel dashboard
2. Check Supabase project settings
3. Ensure RLS policies allow production access

### Issue 2: Build Errors
**Symptoms**:
- Build fails during deployment
- Missing dependencies
- Import/export errors

**Solutions**:
1. Check `package.json` dependencies
2. Ensure all imports are correct
3. Check for client-side only code in server components

### Issue 3: Runtime Errors
**Symptoms**:
- App loads but features don't work
- JavaScript errors in console
- API calls fail

**Solutions**:
1. Check network tab in browser dev tools
2. Verify API endpoints are accessible
3. Check for CORS issues

## Recommended Fixes

### 1. **Update next.config.mjs**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Remove standalone output for Vercel
    // output: 'standalone',
    
    // Add experimental features if needed
    experimental: {
        // Add any experimental features here
    }
};

export default nextConfig;
```

### 2. **Update package.json**
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "vercel-build": "npm install && next build",  // Simplified
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 3. **Add Environment Variable Validation**
Create `src/lib/env.js`:
```javascript
// Validate environment variables
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

// Validate required environment variables
if (!env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}
```

### 4. **Update Supabase Client**
```javascript
// src/lib/supabaseClient.jsx
import { createBrowserClient } from '@supabase/ssr';
import { env } from './env';

export const supabase = createBrowserClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

## Testing Checklist

- [ ] Environment variables are set in Vercel dashboard
- [ ] Build completes successfully locally (`npm run build`)
- [ ] Production build works locally (`npm start`)
- [ ] Supabase connection works in production
- [ ] All GQR pages load correctly
- [ ] Authentication works in production
- [ ] Database queries execute successfully

## Quick Fix Commands

```bash
# 1. Check current deployment
vercel ls

# 2. Check environment variables
vercel env ls --prod

# 3. Redeploy with fixes
vercel --prod

# 4. Check logs after deployment
vercel logs --prod
```

## Common Vercel-Specific Issues

1. **Function Timeout**: Vercel has function execution limits
2. **Memory Limits**: Production has different memory constraints
3. **Cold Starts**: First requests might be slower
4. **Edge Runtime**: Different JavaScript runtime in production

## Next Steps

1. Apply the recommended configuration changes
2. Verify environment variables in Vercel dashboard
3. Test the build locally
4. Redeploy to production
5. Monitor logs for any remaining issues
