/**
 * Preload script — charge .env.local puis .env depuis la racine du monorepo
 * AVANT que les imports ESM de l'app ne résolvent process.env.
 *
 * Utilisation : `tsx --import ./src/load-env.ts src/index.ts`
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../.env.local' });
loadEnv({ path: '../../.env' });
