import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pas d'échec si aucun fichier de test trouvé (V1 — pas de tests web dans Story 1.1)
    passWithNoTests: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
  },
});
