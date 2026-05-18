import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env, isRateLimitConfigured } from './env';

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
};

const noopResult: RateLimitResult = {
  success: true,
  remaining: Number.POSITIVE_INFINITY,
  reset: 0,
  limit: Number.POSITIVE_INFINITY,
};

type Limiter = { limit: (key: string) => Promise<RateLimitResult> };

function makeLimiter(redis: Redis, limit: number, windowSeconds: number, prefix: string): Limiter {
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: false,
    prefix,
  });
  return {
    async limit(key: string) {
      const r = await rl.limit(key);
      return { success: r.success, remaining: r.remaining, reset: r.reset, limit: r.limit };
    },
  };
}

function makeNoop(): Limiter {
  return { limit: async () => noopResult };
}

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (!isRateLimitConfigured || !env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN)
    return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

const redis = getRedis();

export const signupRateLimit: Limiter = redis
  ? makeLimiter(redis, 5, 3600, 'sj:rl:signup')
  : makeNoop();

export const loginRateLimit: Limiter = redis
  ? makeLimiter(redis, 5, 60, 'sj:rl:login')
  : makeNoop();

export const verifyEmailRateLimit: Limiter = redis
  ? makeLimiter(redis, 10, 3600, 'sj:rl:verify-email')
  : makeNoop();

export function getClientIp(hdrs: Headers): string {
  const xff = hdrs.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return hdrs.get('x-real-ip') ?? '127.0.0.1';
}
