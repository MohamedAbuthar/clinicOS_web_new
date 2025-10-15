import type { NextConfig } from "next";
import { config } from 'dotenv';

// Load .env file first, then .env.local (if it exists)
config({ path: '.env' });
config({ path: '.env.local' });

const nextConfig: NextConfig = {
  /* config options here */
  
  // Enable static export for Firebase hosting
  output: 'export',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Optional: Configure base path if deploying to a subdirectory
  // basePath: '',
  
  // Optional: Configure trailing slashes
  trailingSlash: true,
  
  // Environment variables - .env takes priority over .env.local
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  },
};

export default nextConfig;
