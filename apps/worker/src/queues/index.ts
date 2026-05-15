/**
 * SwipeJob Worker — Queue stubs BullMQ
 * Sera implémenté par TECH-005 / Story 1.2+
 *
 * Utilise un Proxy pour détecter les accès au runtime et lever une erreur explicite
 * au lieu de crasher silencieusement sur {} cast.
 */

export const QUEUE_NAMES = {
  CV_PARSING: 'cv-parsing',
  MATCHING: 'matching',
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Proxy stub — sera remplacé par une vraie connexion Redis en Story 1.2
export const queues: Record<QueueName, null> = new Proxy({} as Record<QueueName, null>, {
  get(_target, prop) {
    throw new Error(
      `@swipejob/worker/queues: queue "${String(prop)}" not initialized — implement BullMQ connection in Story 1.2 (TECH-005).`,
    );
  },
});
