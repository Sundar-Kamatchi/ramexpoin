/** @type {import('next').NextConfig} */
const nextConfig = {
    // Remove 'standalone' output for Vercel deployment
    // output: 'standalone'  // This can cause issues with Vercel

    // Add any other configuration here
    experimental: {
        // Add experimental features if needed
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
