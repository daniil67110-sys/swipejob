# Story 4.6: Préférences des canaux de communication

Status: done

## Implémentation

- Colonnes ajoutées à `preferences` (migration 0014) :
  - `pushEnabled boolean default false`
  - `pushTime text default '08:00'`
  - `emailTransactionalEnabled boolean default true` (toujours actif V1 — RGPD-by-design)
  - `emailMarketingEnabled boolean default false`
  - `emailDigestEnabled boolean default false`
  - `emailDigestFrequency text default 'weekly'` ('weekly' | 'never')
  - `emailUnsubscribeToken text unique partial`
- Route `/parametres` (Server Component) avec fetch initial des préférences
- Composant `NotificationsForm` : 3 fieldsets (Push, Emails, Candidatures) avec `<Switch>` Radix
- Server Action `updateNotificationSettingsAction` (zod-validated, save partiel champ par champ)
- Audit log `preferences.notifications_updated` + Posthog `preferences.notifications_updated`
- SMS V2 (déjà placeholder dans architecture)
- Toggle `reviewBeforeSend` exposé ici (résout l'UI manquante de Story 3.7)

## V1 limitations

- Email transactionnel verrouillé on (RGPD : on doit pouvoir notifier l'utilisateur). Désactivation V2 via consentement séparé
- Fréquence digest : weekly | never seulement (daily V2)
- SMS = V2 (placeholder DB column non-créée)
- Pas de preview "à quoi ressemble un email digest" inline

## Change Log

- 2026-05-19 : V1 livrée. Status: done.
