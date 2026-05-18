# Runbook — Consentement parental (mineurs 13-17)

Story de référence : 1.5 (vérification d'âge + consentement parental)

## 1. Cadre légal

- **RGPD art. 8** : âge minimum 13 ans pour consentement seul, fourchette 13-16 selon États membres
- **France** : seuil 15 ans (loi 2018) — au-dessous, consentement parental obligatoire
- **SwipeJob V1** : seuil 13 ans (plancher RGPD), consentement parental requis jusqu'à 17 inclus (prudence + alignement majorité française 18 ans)
- **Référence CNIL** : https://www.cnil.fr/fr/quel-encadrement-pour-lutilisation-des-donnees-personnelles-des-mineurs

## 2. Flow utilisateur

```
[Inscription Google OU email validé]
        ↓
[Layout /(onboarding) constate users.birthDate IS NULL]
        ↓
[/onboarding/age : datepicker]
        ↓
   ┌────────────┼────────────┐
   ↓            ↓            ↓
 <13 ans     13-17 ans    >=18 ans
   ↓            ↓            ↓
 Refus     /onboarding   /etape-1-cv
 mineur    /age/parental    GRANTED
 + soft     ↓
 delete   [Form parent name+email]
              ↓
         [Email Resend → parent]
              ↓
         /envoye (cul-de-sac)
              ↓
   ┌───────────┼───────────┐
   ↓                       ↓
 Parent clique           Parent clique
 ✅ J'autorise          ❌ Je refuse
   ↓                       ↓
 GRANTED               REFUSED
 → user débloqué       → soft delete
                       → logout forcé
```

## 3. Audit events tracés

| Event                                            | Acteur | Trigger                         |
| ------------------------------------------------ | ------ | ------------------------------- |
| `consent.age_verified`                           | USER   | Soumission birthDate, âge >=18  |
| `consent.parental_required`                      | USER   | Soumission birthDate, âge 13-17 |
| `consent.minor_under_13_refused`                 | USER   | Soumission birthDate, âge <13   |
| `account.minor_under_13_anonymization_scheduled` | SYSTEM | <13 → soft delete déclenché     |
| `consent.parental_email_sent`                    | USER   | Form parental envoyé            |
| `consent.parental_granted`                       | SYSTEM | Parent clique ✅                |
| `consent.parental_refused`                       | SYSTEM | Parent clique ❌                |

Tous insertés en `audit_logs` via helper `auditLog()` (append-only RGPD).

## 4. Tokens parent

- 32 bytes random base64url → URL
- sha256 → DB (`parental_consents.token_hash`)
- Validité 7 jours (`expires_at`)
- Soft delete des sessions du mineur si refus

## 5. Anti-spam parent

Rate limit `sj:rl:parental` (3 demandes/h/IP du **mineur**, pas du parent).
But : empêcher un mineur d'envoyer 100 emails à `parent@victim.com` pour le harceler.

## 6. Soft delete <13 ans / refus parental

- `users.deletedAt = NOW()` immédiat
- Sessions DELETE → logout instantané
- **Suppression effective** : job RGPD cron (Story 6.6) sous 30 jours
- Données conservées 30j : pour permettre rétractation parent + audit CNIL contrôle

## 7. Cas edge

### Parent ne répond pas dans les 7j

- `parental_consents.status` reste `PENDING` mais `expires_at < NOW()`
- Au prochain clic du parent → page "lien expiré"
- Mineur peut revenir sur `/onboarding/age/parental` et demander un nouveau lien (rate limit s'applique)

### Parent change d'avis

- V1 : impossible self-service. Le parent doit contacter support@swipejob.fr
- V2 : page admin / dashboard parent dédié (out of scope)

### Mineur fournit fausse date >=18

- Acceptable risk V1 (pas de vérif d'identité)
- Documenté dans CGU : "fausse déclaration d'âge → résiliation immédiate + responsabilité"
- Story 1.10 (suppression profil) permet rectification

### Adultes qui se déclarent mineurs par erreur

- Le user peut revenir sur `/onboarding/age` ? Non — la fn `submitBirthDateAction` n'autorise qu'une seule soumission (verrouille via `users.birthDate IS NULL` côté garde). Mais en pratique V1 : on accepte d'overwrite (la garde redirige tant que `birthDate IS NULL` mais ne re-redirige pas si déjà set). Pour rectifier : support manuel.

## 8. Procédure CNIL contrôle

Si la CNIL demande l'historique d'un consent parental :

```sql
SELECT
  pc.id,
  pc.user_id,
  pc.parent_email,
  pc.status,
  pc.responded_at,
  pc.ip_address,
  pc.user_agent,
  pc.expires_at,
  pc.created_at,
  al.event,
  al.created_at AS audit_at
FROM parental_consents pc
LEFT JOIN audit_logs al ON al.target_id = pc.user_id
   AND al.event LIKE 'consent.parental%'
WHERE pc.user_id = $1
ORDER BY pc.created_at DESC, al.created_at DESC;
```

Conserver 13 mois minimum (rétention `audit_logs`, NFR-O5).
