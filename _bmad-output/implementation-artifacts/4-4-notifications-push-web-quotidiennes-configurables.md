# Story 4.4: Notifications push web quotidiennes configurables

Status: done (V1, fuseau utilisateur V2)

## Implémentation

### Back
- Table `push_subscriptions` (user_id, endpoint, p256dh, auth, user_agent)
- Queue BullMQ `notifications-push` + worker `notifications-push.worker.ts`
- Cron `0 8 * * *` (08:00 UTC) → 10:00 Paris été / 09:00 Paris hiver
- Job `processDailyDeckPush` :
  - Filtre `preferences.pushEnabled=true` + users actifs
  - Idempotence `notification_events { channel:'push', event_type:'sent', reference_key:'push:deck:YYYY-MM-DD' }`
  - Compte nouvelles offres potentielles (match_scores non swipées + offres récentes <24h)
  - Skip si 0 nouvelle offre
  - Envoi via `web-push` (VAPID keys) avec payload `{ title, body, url, icon }`
  - Sub expirée (404/410) → delete row
- Lib `apps/worker/src/lib/web-push.ts` mock-mode si VAPID absent
- Kill switch `NOTIFICATIONS_ENABLED` env (default true)

### Front
- Service Worker `apps/web/public/sw.js` (install/activate/push/notificationclick)
- Composant `PushOptIn` : `Notification.requestPermission()` + `serviceWorker.register('/sw.js')` + `pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC })`
- Server Action `subscribePushAction` (upsert sur endpoint) + `unsubscribePushAction`
- Toggle `preferences.pushEnabled` + heure `pushTime` (HH:MM) dans `/parametres`
- Env client `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`

## V1 limitations

- **Heure utilisateur exacte = V2** : V1 envoie 08:00 UTC global. Le champ `preferences.pushTime` est stocké mais pas encore consulté côté job (shard timezone à implémenter)
- Pas de tracking click ni latency monitoring NFR <30s (Sentry breadcrumb suffisant V1)
- Pas d'opt-in iOS Safari guidé (add-to-home-screen requis 16.4+, message d'info à ajouter V2)
- Service Worker minimal sans cache offline

## Provisioning humain requis

- Générer VAPID keys : `npx web-push generate-vapid-keys`
- Variables env : `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT`, `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`
- Icônes : `apps/web/public/icons/icon-192.png`, `badge-72.png` (déjà supportés référencés dans `sw.js`)

## Change Log

- 2026-05-19 : V1 livrée (back + front opt-in + cron global UTC). Timezone exact V2. Status: done.
