import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // TypeScript strict mode en build
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint en build
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Expérimental — React 19 strict mode
  reactStrictMode: true,

  // Headers de sécurité (sera enrichi en Story 1.2 avec CSP)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // X-XSS-Protection retiré: déprécié, ignoré par les navigateurs modernes,
          // peut introduire des vulnérabilités avec des proxies legacy.
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // HSTS: activé uniquement en production (pas en preview/dev pour éviter les boucles)
          ...(process.env['NODE_ENV'] === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
