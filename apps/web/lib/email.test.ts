/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { warnSpy } = vi.hoisted(() => ({ warnSpy: vi.fn() }));
vi.mock('./logger.server', () => ({
  serverLogger: {
    warn: warnSpy,
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// env mock — unconfigured (no RESEND_API_KEY) for first describe block
vi.mock('./env', () => ({
  env: {
    RESEND_API_KEY: undefined,
    RESEND_FROM: 'noreply@swipejob.fr',
  },
  isEmailConfigured: false,
}));

import { buildVerificationEmailHtml, sendVerificationEmail } from './email';

describe('sendVerificationEmail (mock mode)', () => {
  beforeEach(() => {
    warnSpy.mockClear();
  });

  it('returns mock result when RESEND_API_KEY is missing', async () => {
    const res = await sendVerificationEmail({
      to: 'user@example.com',
      verificationUrl: 'https://app.test/inscription/valider-email?token=abc',
    });
    expect(res).toEqual({ ok: true, id: null, mock: true });
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe('buildVerificationEmailHtml', () => {
  it('includes the verification URL', () => {
    const url = 'https://app.test/inscription/valider-email?token=xyz';
    const html = buildVerificationEmailHtml(url);
    expect(html).toContain(url);
    expect(html).toContain('Valider mon email');
    expect(html).toContain('24h');
  });
});
