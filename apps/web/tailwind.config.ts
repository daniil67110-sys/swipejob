/**
 * SwipeJob Web — Tailwind CSS config
 * Étend le preset de design tokens de @swipejob/config/tailwind/base
 *
 * Note: Tailwind v4 supporte le mode CSS-first (@theme) ET le preset JS.
 * On utilise le preset JS pour une config centralisée dans packages/config.
 */
import type { Config } from 'tailwindcss';
import basePreset from '@swipejob/config/tailwind/base';

const config: Config = {
  presets: [basePreset],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
};

export default config;
