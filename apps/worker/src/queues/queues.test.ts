/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/redis.js', () => ({
  getRedisConnection: vi.fn(() => null),
}));

vi.mock('../lib/logger.js', () => ({
  default: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { getOfferIngestQueue, getCvParseQueue, initializeAllQueues, QUEUE_NAMES } from './index.js';

describe('queues (no Redis configured)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when getRedisConnection returns null', () => {
    expect(getOfferIngestQueue()).toBeNull();
    expect(getCvParseQueue()).toBeNull();
  });

  it('initializeAllQueues returns 0 when Redis unavailable', () => {
    const count = initializeAllQueues();
    expect(count).toBe(0);
  });

  it('exposes the expected queue names', () => {
    expect(Object.values(QUEUE_NAMES)).toContain('offer-ingest');
    expect(Object.values(QUEUE_NAMES)).toContain('cv-parse');
    expect(Object.values(QUEUE_NAMES)).toContain('rgpd-delete');
    expect(Object.values(QUEUE_NAMES)).toContain('failed-jobs');
  });
});
