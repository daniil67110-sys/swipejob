import nextjsConfig from '@swipejob/config/eslint/nextjs';

/** @type {import('typescript-eslint').ConfigArray} */
export default [
  ...nextjsConfig,
  {
    // components/ui/ est géré par shadcn/ui — ne JAMAIS éditer manuellement (convention shadcn)
    // shadcn utilise des noms de fichiers kebab-case par convention (ex: scroll-area.tsx)
    // mais les fichiers exposent des exports PascalCase.
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts', 'components/ui/**'],
  },
];
