# Runbook — Upstash Redis (rate limiting)

Story de référence : 1.4 (rate limit signup 5/h, login 5/min, verify-email 10/h — NFR-S5)

## 1. Créer la base Upstash Redis EU

1. Aller sur https://console.upstash.com/login (compte avec GitHub OK)
2. **Create Database**
3. Nom : `swipejob-ratelimit` (un seul namespace partagé pour les 3 limiters via `prefix`)
4. **Type** : Regional (pas Global — Global = plus cher, pas utile pour rate limiting EU-only)
5. **Region** : `eu-west-1` (Ireland) **OU** `eu-central-1` (Frankfurt)
   — Choisir la région **la plus proche de Vercel app région** pour latence min
6. **Eviction** : `allkeys-lru` (rate limit keys sont éphémères, eviction OK)
7. **TLS** : Enabled (default)
8. Plan : démarrer en Free (10 000 commandes/jour), passer à Pay-as-you-go (~10€/mois) avant lancement

## 2. Récupérer les credentials REST

1. Dashboard Upstash → cliquer sur la DB `swipejob-ratelimit`
2. Onglet **REST API** (pas TCP — on utilise `@upstash/redis` REST pour Vercel edge compat)
3. Copier :
   - **UPSTASH_REDIS_REST_URL** (format `https://xxx-xxx.upstash.io`)
   - **UPSTASH_REDIS_REST_TOKEN** (long token base64)

## 3. Configurer Vercel

1. Vercel project → **Settings** → **Environment Variables** :
   - `UPSTASH_REDIS_REST_URL` (Production + Preview)
   - `UPSTASH_REDIS_REST_TOKEN` (Production + Preview, marquer **Sensitive**)
2. Pour **Development** : optionnel — sans ces vars, le code passe en mode no-op (toujours `success: true`).
   En local on peut soit pointer sur la DB Upstash dev, soit laisser vide.

## 4. Tester en local

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=...

pnpm --filter @swipejob/web dev
# 6 tentatives consécutives de signup depuis la même IP → 6e doit retourner RATE_LIMITED
```

## 5. Limiters configurés (Story 1.4)

| Limiter                | Limite      | Fenêtre  | Prefix Redis         |
| ---------------------- | ----------- | -------- | -------------------- |
| `signupRateLimit`      | 5 requêtes  | 1 heure  | `sj:rl:signup`       |
| `loginRateLimit`       | 5 requêtes  | 1 minute | `sj:rl:login`        |
| `verifyEmailRateLimit` | 10 requêtes | 1 heure  | `sj:rl:verify-email` |

Sliding window — chaque limiter est instancié une fois (singleton) au boot.

## 6. Monitoring

- Dashboard Upstash → **Data Browser** : observer les keys `sj:rl:*`
- Métriques : RPM, latency p99, commandes par jour
- Alerte : si commandes/jour > 80% du plan → upgrade

## 7. Trust du header `x-forwarded-for`

En prod derrière Vercel : `x-forwarded-for` est posé par Vercel edge, **fiable**.
En dev local : peut être manipulé par le client → acceptable risk V1.
En V2 + Cloudflare : passer à `cf-connecting-ip` (cf. `apps/web/lib/rate-limit.ts` `getClientIp()`).

## 8. Reset manuel d'une IP

Si un user légitime se fait flagger par accident :

```bash
# CLI Upstash Redis
upstash redis cli --url $UPSTASH_REDIS_REST_URL --token $UPSTASH_REDIS_REST_TOKEN
> KEYS sj:rl:signup:<ip>
> DEL sj:rl:signup:<ip>
```
