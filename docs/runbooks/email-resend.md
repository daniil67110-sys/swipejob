# Runbook — Resend (email transactionnel)

Story de référence : 1.4 (inscription email/password — magic link de validation)

## 1. Créer le compte Resend EU

1. Aller sur https://resend.com/signup
2. Créer un compte (utiliser l'email équipe `equipe@swipejob.fr`)
3. **Important** : sélectionner la région **EU (Ireland)** pour la résidence des données RGPD
4. Plan : démarrer en Free (3 000 emails/mois), passer à Pro (~20€/mois) avant lancement

## 2. Vérifier le domaine `swipejob.fr`

1. Dans le dashboard Resend → **Domains** → **Add Domain** → entrer `swipejob.fr`
2. Resend affiche 3 enregistrements DNS à ajouter chez le registrar :
   - **MX** (1 record) pour le bounce handling
   - **TXT SPF** (1 record) pour l'authentification
   - **DKIM** (2-3 records CNAME) pour la signature des emails
3. Ajouter les records chez le registrar du domaine (ex. OVH, Gandi). Propagation : 10 min à 2h.
4. Dans Resend, cliquer **Verify DNS Records** — attendre que tous passent en vert
5. **Ne pas** lancer en prod tant que SPF + DKIM ne sont pas verts (déliverabilité catastrophique sinon)

## 3. Créer l'API Key

1. Dashboard Resend → **API Keys** → **Create API Key**
2. Nom : `swipejob-prod` (ou `swipejob-preview` / `swipejob-dev`)
3. Permission : **Sending access** (full sending, jamais admin)
4. Copier la clé (format `re_xxx`) — visible une seule fois

## 4. Configurer Vercel

1. Vercel project → **Settings** → **Environment Variables** :
   - `RESEND_API_KEY` = `re_xxx` (Production + Preview, jamais Development pour éviter spam involontaire)
   - `RESEND_FROM` = `noreply@swipejob.fr` (Production + Preview + Development pour cohérence)
2. Redéployer pour appliquer

## 5. Tester en local

```bash
# .env.local
RESEND_API_KEY=re_xxx
RESEND_FROM=noreply@swipejob.fr
SITE_URL=http://localhost:3000

pnpm --filter @swipejob/web dev
# Aller sur http://localhost:3000/inscription/email
# Soumettre un email réel à toi — vérifier la boîte
```

**En l'absence de `RESEND_API_KEY`**, le code passe en **mode mock** : il log un warn avec le contenu de l'email + retourne `{ ok: true, mock: true }`. Aucun email réel envoyé.

## 6. Monitoring

- Dashboard Resend → **Emails** : statut delivery, bounces, complaints
- Webhooks Resend (bounces, complaints) → à implémenter en V2 (out of scope V1, voir architecture.md ligne 793)
- Alerte : si bounce rate >5% → vérifier listes (signe d'attaque par email-burning, NFR-S5)

## 7. Renouvellement / Rotation

- API keys : rotation tous les 90 jours (politique secrets)
- Procédure : créer nouvelle clé → ajouter à Vercel → redéployer → supprimer ancienne clé
