'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { updateNotificationSettingsAction } from './actions';

export type NotificationSettings = {
  pushEnabled: boolean;
  pushTime: string;
  emailMarketingEnabled: boolean;
  emailDigestEnabled: boolean;
  emailDigestFrequency: 'weekly' | 'never';
  reviewBeforeSend: boolean;
};

export function NotificationsForm({ initial }: { initial: NotificationSettings }) {
  const router = useRouter();
  const [state, setState] = useState<NotificationSettings>(initial);
  const [error, setError] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(0);
  const [isPending, startTransition] = useTransition();

  const save = (next: Partial<NotificationSettings>) => {
    const optimistic = { ...state, ...next };
    setState(optimistic);
    setError(null);
    startTransition(async () => {
      const res = await updateNotificationSettingsAction(next);
      if (!res.ok) {
        setError(res.error.message);
        setState(state);
        return;
      }
      setSavedTick(Date.now());
      router.refresh();
    });
  };

  return (
    <form className="space-y-5" aria-busy={isPending}>
      <fieldset className="space-y-4 rounded-2xl bg-[#f7f5f1] p-5 ring-1 ring-neutral-200">
        <legend className="px-2 text-caption font-semibold uppercase tracking-[0.14em] text-neutral-700">
          Notifications push
        </legend>
        <Row>
          <Label htmlFor="pushEnabled" className="flex-1 text-body-sm text-neutral-800">
            Recevoir une notification le matin avec mon deck du jour
          </Label>
          <Switch
            id="pushEnabled"
            checked={state.pushEnabled}
            onCheckedChange={(v) => save({ pushEnabled: v })}
            disabled={isPending}
          />
        </Row>
        <AnimatePresence initial={false}>
          {state.pushEnabled ? (
            <motion.div
              key="pushTime"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <Row>
                <Label htmlFor="pushTime" className="flex-1 text-body-sm text-neutral-800">
                  Heure d’envoi (locale)
                </Label>
                <input
                  id="pushTime"
                  type="time"
                  value={state.pushTime}
                  onChange={(e) => setState({ ...state, pushTime: e.target.value })}
                  onBlur={() => save({ pushTime: state.pushTime })}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
                />
              </Row>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl bg-[#f7f5f1] p-5 ring-1 ring-neutral-200">
        <legend className="px-2 text-caption font-semibold uppercase tracking-[0.14em] text-neutral-700">
          Emails
        </legend>
        <Row>
          <Label className="flex-1 text-body-sm text-neutral-800">
            Email transactionnel (vérif, RGPD)
          </Label>
          <span className="italic text-caption text-neutral-500">Toujours actif</span>
        </Row>
        <Row>
          <Label htmlFor="emailDigest" className="flex-1 text-body-sm text-neutral-800">
            Récap hebdomadaire (dimanche soir)
          </Label>
          <Switch
            id="emailDigest"
            checked={state.emailDigestEnabled}
            onCheckedChange={(v) =>
              save({
                emailDigestEnabled: v,
                emailDigestFrequency: v ? 'weekly' : 'never',
              })
            }
            disabled={isPending}
          />
        </Row>
        <Row>
          <Label htmlFor="emailMarketing" className="flex-1 text-body-sm text-neutral-800">
            Annonces produit & promos
          </Label>
          <Switch
            id="emailMarketing"
            checked={state.emailMarketingEnabled}
            onCheckedChange={(v) => save({ emailMarketingEnabled: v })}
            disabled={isPending}
          />
        </Row>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl bg-[#f7f5f1] p-5 ring-1 ring-neutral-200">
        <legend className="px-2 text-caption font-semibold uppercase tracking-[0.14em] text-neutral-700">
          Candidatures
        </legend>
        <Row>
          <div className="flex-1 space-y-1">
            <Label htmlFor="reviewBeforeSend" className="text-body-sm text-neutral-800">
              Relire ma lettre avant envoi
            </Label>
            <p className="text-caption text-neutral-500">
              Tu pourras éditer ou régénérer chaque lettre IA avant qu&apos;elle parte. Sinon, swipe
              = envoi direct.
            </p>
          </div>
          <Switch
            id="reviewBeforeSend"
            checked={state.reviewBeforeSend}
            onCheckedChange={(v) => save({ reviewBeforeSend: v })}
            disabled={isPending}
          />
        </Row>
      </fieldset>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key={`err-${error}`}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-body-sm text-error-500"
          >
            {error}
          </motion.p>
        ) : savedTick > 0 ? (
          <motion.p
            key={`ok-${savedTick}`}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="italic text-caption text-neutral-500"
          >
            Préférences enregistrées.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </form>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>;
}
