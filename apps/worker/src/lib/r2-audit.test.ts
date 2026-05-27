import { describe, expect, it } from 'vitest';
import { buildAuditArchiveKey } from './r2-audit.js';

describe('buildAuditArchiveKey', () => {
  it('produces the expected R2 key format', () => {
    expect(buildAuditArchiveKey('2026-04')).toBe('audit-archive/2026/04/audit-2026-04.jsonl.gz');
  });

  it('handles December correctly (zero-padded month)', () => {
    expect(buildAuditArchiveKey('2025-12')).toBe('audit-archive/2025/12/audit-2025-12.jsonl.gz');
  });
});
