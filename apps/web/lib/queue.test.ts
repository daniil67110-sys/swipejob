/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('./env', () => ({
  env: { REDIS_URL: undefined },
  isQueueConfigured: false,
}));

vi.mock('./logger.server', () => ({
  serverLogger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { enqueueCvParse, enqueueRgpdDelete } from './queue';

describe('enqueueCvParse (mock mode)', () => {
  it('returns mock result when REDIS_URL missing', async () => {
    const res = await enqueueCvParse({ cvId: 'cv1', userId: 'u1' });
    expect(res).toEqual({ ok: true, jobId: null, mock: true });
  });
});

describe('enqueueRgpdDelete (mock mode)', () => {
  it('returns mock result when REDIS_URL missing', async () => {
    const res = await enqueueRgpdDelete({ userId: 'u1' });
    expect(res).toEqual({ ok: true, jobId: null, mock: true });
  });
});
