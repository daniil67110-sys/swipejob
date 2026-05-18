# Runbook — Mistral La Plateforme (LLM CV parsing)

Story de référence : 1.7 (parsing CV)

## 1. Créer le compte

1. https://console.mistral.ai/auth/signup
2. Compte avec email équipe (les data Mistral restent en UE)
3. Plan : Free Tier (1M tokens/mois) pour dev, payant pour prod (~0,02€ / 1k tokens input + 0,06€ / 1k output sur `mistral-large`)

## 2. Créer l'API key

1. Dashboard → **API Keys** → **Create new key**
2. Nom : `swipejob-prod` (un par env)
3. Copier la clé `sk-...` (visible une seule fois)

## 3. Configurer Vercel

- `MISTRAL_API_KEY` (Production + Preview, **Sensitive**)
- `MISTRAL_MODEL` = `mistral-large-latest` (par défaut, modifiable en preview pour tester `mistral-medium`)

Sans la clé → **mode fallback** (regex simpliste sur phone uniquement, le user édite manuellement).

## 4. Monitoring

- Dashboard Mistral → **Usage** : tokens consommés / mois
- `ia_audit_logs` DB : `model`, `latency_ms`, `tokens_input`, `tokens_output`, `success` par appel
- Requête analytics : `SELECT model, AVG(latency_ms), SUM(tokens_input + tokens_output) FROM ia_audit_logs WHERE feature_type='cv_parse' AND created_at > NOW() - INTERVAL '7 days' GROUP BY model`

## 5. Limites + retry

- V1 : 1 tentative, fallback regex en cas d'échec (Mistral down, JSON invalide, Zod fail)
- V2 : retry policy via worker BullMQ (Story 2.1) — 3 tentatives exponential backoff

## 6. Coût estimé

- CV moyen : ~1k tokens input, ~500 tokens output → ~0,05€ par parsing
- 30k users × 1 CV/user = 1500€/an. Pas négligeable mais acceptable.
- Optimisation : cache prompt_hash en DB pour skip re-parsing si même texte (V2)
