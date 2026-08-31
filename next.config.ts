import type { NextConfig } from 'next';

// EMMA Desktop renderiza Next como export estático servido por electron-serve
// (app://-) en producción y por el dev-server (localhost:3000) en desarrollo.
const nextConfig: NextConfig = {
  output: 'export',
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
