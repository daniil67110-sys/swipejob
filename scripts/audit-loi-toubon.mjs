#!/usr/bin/env node
/**
 * Story 6.7 — Audit Loi Toubon.
 *
 * Scanne `apps/web/{app,components,lib,actions,hooks}/**\/*.{ts,tsx}` à la recherche
 * de littéraux string contenant des mots EN typiques d'UI qu'on ne devrait pas
 * trouver côté FR (Loi du 4 août 1994).
 *
 * Liste curated pour éviter les faux positifs (mots qui existent aussi en
 * français comme "email" ou "menu").
 *
 * Usage : `node scripts/audit-loi-toubon.mjs`
 * Exit 0 si propre, 1 sinon. CI peut l'inclure en check non-bloquant V1.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_DIRS = [
  'apps/web/app',
  'apps/web/components',
  'apps/web/lib',
  'apps/web/actions',
  'apps/web/hooks',
];
const SKIP_PATHS = [
  /node_modules/,
  /\.next/,
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
  /\.stories\.(ts|tsx)$/,
  // Le script d'audit + le test E2E contiennent volontairement la liste EN.
  /audit-loi-toubon\.mjs$/,
  /loi-toubon\.spec\.ts$/,
];

// Suspects = expressions EN courantes d'UI qui devraient être en FR.
// La regex contient \b word boundaries pour ne pas matcher "submitter", etc.
const SUSPECT_PATTERNS = [
  /\bSign in\b/,
  /\bSign up\b/,
  /\bLog in\b/,
  /\bLog out\b/,
  /\bForgot password\b/,
  /\bSubmit\b/,
  /\bLoading\.\.\./,
  /\bWelcome back\b/,
  /\bSearch jobs\b/,
  /\bApply now\b/,
  /\bContinue with\b/,
  /\bPrivacy Policy\b/,
  /\bTerms of Service\b/,
  /\bCookie Policy\b/,
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (SKIP_PATHS.some((p) => p.test(full))) continue;
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(full)) files.push(full);
  }
  return files;
}

const findings = [];
for (const sub of SCAN_DIRS) {
  const abs = join(ROOT, sub);
  try {
    statSync(abs);
  } catch {
    continue;
  }
  for (const file of walk(abs)) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      for (const pattern of SUSPECT_PATTERNS) {
        if (pattern.test(line)) {
          findings.push({
            file: relative(ROOT, file),
            line: i + 1,
            text: line.trim().slice(0, 120),
            pattern: pattern.source,
          });
        }
      }
    });
  }
}

if (findings.length === 0) {
  console.log('✅ Audit Loi Toubon : aucune chaîne EN suspecte détectée.');
  process.exit(0);
}

console.log(`⚠️ Audit Loi Toubon : ${findings.length} chaîne(s) EN suspecte(s) détectée(s) :\n`);
for (const f of findings) {
  console.log(`  ${f.file}:${f.line}  /${f.pattern}/`);
  console.log(`    ${f.text}`);
}
console.log('\nRappel : migrer ces chaînes vers `apps/web/messages/fr-FR.json` (Story 6.7).');
process.exit(1);
