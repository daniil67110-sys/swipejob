# Story 3.9: Quota quotidien

Status: done

## Implémentation

- `apps/web/lib/swipe-quota.ts` :
  - `QUOTA = { freeMinor: 5, freeMajor: 20, premium: 50 }` (premium V2)
  - `getDailyQuota(userId)` : retourne 5 si mineur, 20 sinon
  - `countTodayApplications(userId)` : COUNT applications WHERE createdAt >= startOfDay AND status != cancelled
  - `isOverQuota(userId)` : helper
- Check dans `swipeOfferAction` avant insert application
- Si dépassé → `{ ok: false, error: { code: 'DAILY_QUOTA_REACHED', message: ... } }`
- Posthog `quota.reached` + audit log `quota.daily_limit_reached`

## V1 limitations

- Reset minuit UTC V1 (V2 = Europe/Paris exact)
- Pas de premium tier UI V1
- Pas de rate limit Upstash en plus (V2 — déjà NFR-S5 fait Story 1.4)

## Change Log

- 2026-05-19 : V1 livrée. Status: done.
