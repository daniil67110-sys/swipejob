'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
    <form className="space-y-6" aria-busy={isPending}>
      <fieldset className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-0 p-4">
        <legend className="px-1 text-sm font-semibold">Notifications push</legend>
        <Row>
          <Label htmlFor="pushEnabled" className="flex-1">
            Recevoir une notification le matin avec mon deck du jour
          </Label>
          <Switch
            id="pushEnabled"
            checked={state.pushEnabled}
            onCheckedChange={(v) => save({ pushEnabled: v })}
            disabled={isPending}
          />
        </Row>
        {state.pushEnabled ? (
          <Row>
            <Label htmlFor="pushTime" className="flex-1">
              Heure d’envoi (locale)
            </Label>
            <input
              id="pushTime"
              type="time"
              value={state.pushTime}
              onChange={(e) => setState({ ...state, pushTime: e.target.value })}
              onBlur={() => save({ pushTime: state.pushTime })}
              className="rounded-md border border-neutral-200 px-2 py-1 text-sm"
            />
          </Row>
        ) : null}
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-0 p-4">
        <legend className="px-1 text-sm font-semibold">Emails</legend>
        <Row>
          <Label className="flex-1">Email transactionnel (vérif, RGPD)</Label>
          <span className="text-xs text-neutral-500">Toujours actif (obligatoire)</span>
        </Row>
        <Row>
          <Label htmlFor="emailDigest" className="flex-1">
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
          <Label htmlFor="emailMarketing" className="flex-1">
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

      <fieldset className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-0 p-4">
        <legend className="px-1 text-sm font-semibold">Candidatures</legend>
        <Row>
          <Label htmlFor="reviewBeforeSend" className="flex-1">
            Relire ma lettre avant envoi (Story 3.7)
          </Label>
          <Switch
            id="reviewBeforeSend"
            checked={state.reviewBeforeSend}
            onCheckedChange={(v) => save({ reviewBeforeSend: v })}
            disabled={isPending}
          />
        </Row>
      </fieldset>

      {error ? (
        <p role="status" aria-live="polite" className="text-sm text-error-500">
          {error}
        </p>
      ) : savedTick > 0 ? (
        <p role="status" aria-live="polite" className="text-xs text-neutral-500">
          Préférences enregistrées.
        </p>
      ) : null}
    </form>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>;
}
