import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  reactStrictMode: true,

  // Transpile workspace packages (TS sources sans build préalable)
  transpilePackages: ['@swipejob/db', '@swipejob/types'],

  // argon2 = native binding (.node) — ne pas bundler côté webpack (Story 1.4).
  serverExternalPackages: ['argon2'],

  // webpack extensionAlias : autorise les imports `.js` à résoudre vers `.ts`
  // (nécessaire pour les workspace packages compilés en NodeNext qui utilisent
  // des imports `.js` mais dont le source réel est `.ts`).
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
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

const sentryAuthAvailable = Boolean(
  process.env['SENTRY_AUTH_TOKEN'] && process.env['SENTRY_ORG'] && process.env['SENTRY_PROJECT'],
);

export default sentryAuthAvailable
  ? withSentryConfig(nextConfig, {
      org: process.env['SENTRY_ORG'],
      project: process.env['SENTRY_PROJECT'],
      authToken: process.env['SENTRY_AUTH_TOKEN'],
      silent: !process.env['CI'],
      widenClientFileUpload: true,
      sourcemaps: {
        disable: false,
        deleteSourcemapsAfterUpload: true,
      },
      disableLogger: true,
      automaticVercelMonitors: false,
    })
  : nextConfig;
