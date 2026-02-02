import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración de SASS
  sassOptions: {
    implementation: 'sass-embedded',
  },

  // Ignorar errores de ESLint durante el build (ya validamos en desarrollo)
  eslint: {
    ignoreDuringBuilds: true
  },

  // Ignorar errores de TypeScript durante el build (opcional, quitar si quieres validación estricta)
  typescript: {
    ignoreBuildErrors: false,
  },

  // Optimizaciones de producción
  reactStrictMode: true,

  // Dominios permitidos para imágenes
  images: {
    domains: [
      "www.google.com",
      "storage.googleapis.com",
      "www.udg.mx",
      // Agregar dominios de tu backend si sirves imágenes desde ahí
      "sigcap-api.onrender.com",
      "sigcap-api-prod.onrender.com",
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
