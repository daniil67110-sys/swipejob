import 'server-only';
import * as argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXlzYWx0ZHVtbXlzYWw$Zm9yX3RpbWluZ19jb25zdGFudF9jb21wYXJpc29uX29ubHk';

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/**
 * Run verify against a known-bad hash. Used to keep timing constant when the user
 * lookup returns nothing — without this, login response time leaks email existence.
 */
export async function verifyPasswordTimingSafe(
  hashOrNull: string | null | undefined,
  plain: string,
): Promise<boolean> {
  const hash = hashOrNull ?? DUMMY_HASH;
  const ok = await verifyPassword(hash, plain);
  return Boolean(hashOrNull) && ok;
}
