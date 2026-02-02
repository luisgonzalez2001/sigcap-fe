import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración de SASS
  sassOptions: {
    implementation: 'sass-embedded',
  },

  // Ignorar errores de TypeScript durante el build (opcional, quitar si quieres validación estricta)
  typescript: {
    ignoreBuildErrors: false,
  },

  // Optimizaciones de producción
  reactStrictMode: true,

  // Dominios permitidos para imágenes (usando remotePatterns en lugar de domains)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'www.udg.mx',
      },
      {
        protocol: 'https',
        hostname: 'sigcap-api.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'sigcap-api-prod.onrender.com',
      },
    ],
  },

  // Headers de seguridad para producción
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
