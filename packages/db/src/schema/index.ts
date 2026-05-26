export * from './users.js';
export * from './accounts.js';
export * from './sessions.js';
export * from './verification-tokens.js';
export * from './profiles.js';
export * from './audit-logs.js';
export * from './ia-audit-logs.js';
export * from './parental-consents.js';
export * from './cvs.js';
export * from './preferences.js';
export * from './schools.js';
export * from './offer-sources.js';
export * from './offers.js';
export * from './match-scores.js';
export * from './swipe-events.js';
export * from './applications.js';
export * from './interview-preps.js';
export * from './push-subscriptions.js';
export * from './notification-events.js';
export * from './user-badges.js';
export * from './referrals.js';

import { accounts } from './accounts.js';
import { applicationEvents, applications, watchlist } from './applications.js';
import { auditLogs } from './audit-logs.js';
import { cvs } from './cvs.js';
import { iaAuditLogs } from './ia-audit-logs.js';
import { interviewPreps } from './interview-preps.js';
import { matchScores } from './match-scores.js';
import { notificationEvents } from './notification-events.js';
import { offerSources } from './offer-sources.js';
import { offers } from './offers.js';
import { parentalConsents } from './parental-consents.js';
import { preferences } from './preferences.js';
import { profiles } from './profiles.js';
import { pushSubscriptions } from './push-subscriptions.js';
import { referralCodes, referrals } from './referrals.js';
import { userBadges } from './user-badges.js';
import { schools } from './schools.js';
import { sessions } from './sessions.js';
import { swipeEvents } from './swipe-events.js';
import { users } from './users.js';
import { verificationTokens } from './verification-tokens.js';

export const schema = {
  users,
  accounts,
  sessions,
  verificationTokens,
  profiles,
  auditLogs,
  iaAuditLogs,
  parentalConsents,
  cvs,
  preferences,
  schools,
  offerSources,
  offers,
  matchScores,
  swipeEvents,
  applications,
  applicationEvents,
  watchlist,
  interviewPreps,
  pushSubscriptions,
  notificationEvents,
  userBadges,
  referralCodes,
  referrals,
} as const;

export type Schema = typeof schema;
