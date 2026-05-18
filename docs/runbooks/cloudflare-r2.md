# Runbook — Cloudflare R2 (stockage CV)

Story de référence : 1.6 (upload CV PDF)

## 1. Créer le bucket EU

1. https://dash.cloudflare.com → R2 Object Storage → **Create bucket**
2. Nom : `swipejob-dev` (un par env : `swipejob-prod`, `swipejob-preview`, `swipejob-dev`)
3. **Location hint** : `eu` (EU jurisdiction RGPD)
4. **Storage class** : Standard (V1)
5. Pas de public access (private bucket)

## 2. Créer l'API token IAM

1. Dashboard → R2 → **Manage API Tokens** → **Create API Token**
2. Permission : **Object Read & Write**
3. Bucket scope : `swipejob-dev` (un token par env, jamais wildcard)
4. Optional : Restrict TTL à 1 an, rotation
5. Copier `Access Key ID` + `Secret Access Key` (visible une seule fois)
6. Copier aussi le `Account ID` (sidebar dashboard)

## 3. Configurer Vercel

| Var                    | Production      | Preview            | Development    |
| ---------------------- | --------------- | ------------------ | -------------- |
| `R2_ACCOUNT_ID`        | `<account-id>`  | `<account-id>`     | (laisser vide) |
| `R2_ACCESS_KEY_ID`     | `<prod-key>`    | `<preview-key>`    | (laisser vide) |
| `R2_SECRET_ACCESS_KEY` | `<prod-secret>` | `<preview-secret>` | (laisser vide) |
| `R2_BUCKET_NAME`       | `swipejob-prod` | `swipejob-preview` | `swipejob-dev` |

Marquer les secrets comme **Sensitive**.
Sans ces vars en dev → mode mock (upload loggé, pas réel).

## 4. Tester en local

```bash
# .env.local
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=swipejob-dev

pnpm --filter @swipejob/web dev
# Visite http://localhost:3000/etape-1-cv (après auth)
# Upload un PDF — vérifier dans R2 dashboard que l'objet existe
```

## 5. Convention objet R2

```
users/<userId>/cvs/v<n>/<cuid2>.pdf
```

- Préfixe utilisateur permet purge facile sur `DELETE FROM users`
- Versioning explicit (`v1`, `v2`, …) — réuploads ne s'écrasent pas
- cuid2 suffix évite la prédictibilité

## 6. Sécurité

- **AES256 server-side encryption** : enforce dans `PutObjectCommand`
- **No public access** : tous les téléchargements passent par presigned URL (V1.6 = pas d'accès lecture, le worker Story 1.7 lira via SDK)
- **Magic bytes check** côté serveur : reject si pas `%PDF`
- **Max 10 MB** enforced côté serveur
- **Rate limit** 10 uploads/h/user (Upstash)

## 7. Suppression effective

V1 : pas de delete automatique. Quand un user demande la suppression de compte
(Story 1.10 / 6.4) ou anonymisation 24 mois (Story 6.6), un job worker scanne
le préfixe `users/<userId>/cvs/` et fait `DeleteObjects` batch.

## 8. Coût estimé

R2 EU : ~0,015€/GB/mois storage + 0€ egress. Pour 30k users × 1 CV moyen 1MB
→ 30GB → ~0,45€/mois. Négligeable face à Neon (50€) et Mistral (1000€+).
