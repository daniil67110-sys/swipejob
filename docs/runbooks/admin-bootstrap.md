# Bootstrap du back-office admin

> Story 8.1 — Comment promouvoir un utilisateur en `ADMIN` pour accéder à `/admin`.

## Contexte

Le back-office `/admin` est protégé par `requireAdmin()` (apps/web/lib/auth.ts). Il vérifie que la session est associée à un user dont `users.role = 'ADMIN'`. Sinon : 404 (volontairement opaque pour ne pas révéler la route).

Aucun utilisateur n'a le rôle `ADMIN` par défaut. Pour bootstrapper le premier admin, il faut :

1. Que l'utilisateur ait d'abord créé son compte SwipeJob (via Google OAuth sur `/inscription`).
2. Exécuter le script `db:grant-admin` qui passe le rôle `USER` → `ADMIN`.

## Procédure

```bash
# Depuis la racine du monorepo, avec DATABASE_URL pointant sur la base cible
pnpm db:grant-admin oksana.opanasenko12@gmail.com
```

Sortie attendue :

```
[grant-admin] ✓ user "oksana.opanasenko12@gmail.com" : role USER → ADMIN
```

Idempotent : si le user est déjà admin, le script affiche `No-op` et ne touche pas à la base.

## Révocation

```bash
pnpm db:grant-admin un-email@example.com --role USER
```

## Garde-fous du script

- Refus si l'email est inconnu (pas de création silencieuse).
- Refus si le user est soft-deleted (`deletedAt IS NOT NULL`).
- Aucune confirmation interactive (script idempotent), mais log clair des transitions.

## Audit

Chaque promotion / révocation devrait être tracée. **Pour l'instant le script n'écrit pas dans `audit_logs`** — c'est volontaire pour 8.1 (script de bootstrap exécuté hors-ligne). Une fois l'admin UI livrée (Story 8.4), les changements de rôle se feront via l'interface qui écrit dans `audit_logs` avec `actorType=ADMIN` et `event=user.role_changed`.

## Vérification

Après promotion, l'utilisateur peut se déconnecter / reconnecter (la session contient `role`, propagé via le callback `session` dans `apps/web/lib/auth.ts`) puis visiter `/admin`. S'il voit un 404, c'est que :

- Soit le cache de session Auth.js n'est pas rafraîchi → forcer un sign-out / sign-in.
- Soit la migration n'a pas été appliquée sur la DB ciblée (`pnpm db:migrate`).
