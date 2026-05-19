'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { subscribePushAction, unsubscribePushAction } from './push-actions';

/**
 * Story 4.4 — opt-in Web Push côté client.
 *
 * V1 limits :
 *  - Pas de detection iOS PWA flow (Safari demande add-to-home-screen)
 *  - Pas de fallback notif locale si Notification.permission='denied'
 *  - V2 : timezone-aware push_time côté worker
 */
export function PushOptIn({ vapidPublicKey }: { vapidPublicKey?: string }) {
  const [supported, setSupported] = useState<boolean>(false);
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unknown'>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const ok =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      Boolean(vapidPublicKey);
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => undefined);
  }, [vapidPublicKey]);

  if (!supported) {
    return (
      <p className="text-xs text-neutral-500">
        Ton navigateur ne supporte pas les notifications push.
      </p>
    );
  }

  const enable = () => {
    setError(null);
    startTransition(async () => {
      try {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== 'granted') {
          setError('Autorisation refusée.');
          return;
        }
        const reg =
          (await navigator.serviceWorker.getRegistration()) ??
          (await navigator.serviceWorker.register('/sw.js'));
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey!).buffer as ArrayBuffer,
        });
        const json = sub.toJSON();
        const res = await subscribePushAction({
          endpoint: json.endpoint!,
          p256dh: json.keys!['p256dh']!,
          auth: json.keys!['auth']!,
        });
        if (!res.ok) {
          setError(res.error.message);
          await sub.unsubscribe().catch(() => undefined);
          return;
        }
        setSubscribed(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue.');
      }
    });
  };

  const disable = () => {
    setError(null);
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await unsubscribePushAction(sub.endpoint);
          await sub.unsubscribe();
        }
        setSubscribed(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue.');
      }
    });
  };

  return (
    <div className="space-y-2">
      {subscribed ? (
        <Button variant="outline" onClick={disable} disabled={isPending}>
          Désactiver les notifications push
        </Button>
      ) : (
        <Button onClick={enable} disabled={isPending || permission === 'denied'}>
          Activer les notifications push
        </Button>
      )}
      {permission === 'denied' ? (
        <p className="text-xs text-neutral-500">
          Permissions bloquées par le navigateur. Active-les manuellement dans les paramètres.
        </p>
      ) : null}
      {error ? (
        <p role="status" aria-live="polite" className="text-xs text-error-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}
