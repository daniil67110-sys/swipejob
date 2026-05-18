/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('./env', () => ({
  env: {
    R2_ACCOUNT_ID: undefined,
    R2_ACCESS_KEY_ID: undefined,
    R2_SECRET_ACCESS_KEY: undefined,
    R2_BUCKET_NAME: undefined,
  },
  isR2Configured: false,
}));

vi.mock('./logger.server', () => ({
  serverLogger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { generateR2Key, uploadCvToR2 } from './r2';

describe('generateR2Key', () => {
  it('builds the namespaced key', () => {
    const key = generateR2Key('user-abc', 3);
    expect(key.startsWith('users/user-abc/cvs/v3/')).toBe(true);
    expect(key.endsWith('.pdf')).toBe(true);
  });

  it('produces unique keys for the same user+version', () => {
    const a = generateR2Key('u1', 1);
    const b = generateR2Key('u1', 1);
    expect(a).not.toBe(b);
  });
});

describe('uploadCvToR2 (mock mode)', () => {
  it('returns mock result when R2 not configured', async () => {
    const res = await uploadCvToR2({
      buffer: Buffer.from('%PDF-1.4 fake'),
      contentType: 'application/pdf',
      key: 'users/u1/cvs/v1/abc.pdf',
    });
    expect(res).toEqual({ ok: true, key: 'users/u1/cvs/v1/abc.pdf', mock: true });
  });
});
