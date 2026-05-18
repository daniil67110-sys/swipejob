/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('./env', () => ({
  env: { MISTRAL_API_KEY: undefined, MISTRAL_MODEL: 'mistral-large-latest' },
  isLlmConfigured: false,
}));

vi.mock('./logger.server', () => ({
  serverLogger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { parseCvWithLLM } from './cv-parser';

describe('parseCvWithLLM (fallback mode)', () => {
  it('returns empty ParsedCv with parsedByFallback=true when Mistral missing', async () => {
    const res = await parseCvWithLLM('Random CV text\nphone +33 6 12 34 56 78');
    expect(res.meta.parsedByFallback).toBe(true);
    expect(res.meta.model).toBe('fallback');
    expect(res.parsedCv.firstName).toBeNull();
    // phone regex catch
    expect(res.parsedCv.phoneE164).toBeTruthy();
  });

  it('exposes promptHash + latency in meta', async () => {
    const res = await parseCvWithLLM('hello');
    expect(res.meta.promptHash).toMatch(/^[a-f0-9]{64}$/);
    expect(typeof res.meta.latencyMs).toBe('number');
  });
});
