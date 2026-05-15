import type { MetadataRoute } from 'next';

/**
 * PWA Web App Manifest
 * Sera complété en Story 4.4 (notifications push web)
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SwipeJob',
    short_name: 'SwipeJob',
    description: 'Trouve ton job en swipant — IA matching',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F9FC',
    theme_color: '#4F5BFF',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
