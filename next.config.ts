import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  sassOptions: {
    implementation: 'sass-embedded',
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    domains: ["www.google.com", "storage.googleapis.com", "www.udg.mx"],
  },
};

export default nextConfig;
