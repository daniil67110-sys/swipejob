'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { reportSignatureAction } from './actions';
import { useBadgeUnlock } from '@/components/engagement/BadgeUnlockProvider';

/**
 * Story 4.3 + 5.5 — Modal "Reporter ma signature 🎉".
 *
 * Au succès → redirige vers /wrapped/[applicationId] (Story 5.5).
 */
export function ReportSignatureModal({
  applicationId,
  open,
  onOpenChange,
}: {
  applicationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { trigger: triggerBadgeUnlock } = useBadgeUnlock();
  const [salary, setSalary] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirm = () => {
    setError(null);
    const salaryAnnualCents = salary ? Math.round(Number.parseFloat(salary) * 100) : undefined;
    startTransition(async () => {
      const res = await reportSignatureAction({
        applicationId,
        ...(salaryAnnualCents != null && Number.isFinite(salaryAnnualCents)
          ? { salaryAnnualCents }
          : {}),
      });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      if (res.data.unlockedBadges?.length) triggerBadgeUnlock(res.data.unlockedBadges);
      setConfetti(true);
      window.setTimeout(() => {
        onOpenChange(false);
        setConfetti(false);
        router.push(`/wrapped/${applicationId}`);
        router.refresh();
      }, 1500);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer ta signature 🎉</DialogTitle>
        </DialogHeader>

        {confetti ? (
          <div
            aria-live="polite"
            className="flex flex-col items-center gap-3 py-8 text-center"
            role="status"
          >
            <p className="text-3xl">🎉✨🎊</p>
            <p className="text-lg font-semibold">Bravo, c’est signé !</p>
            <p className="text-sm text-neutral-600">Préparation de ton récap…</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Tu peux ajouter ton salaire annuel pour qu’on le calcule dans ton récap. Cette info
              reste privée.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="salary">Salaire annuel brut (€)</Label>
              <Input
                id="salary"
                type="number"
                min={0}
                step={100}
                placeholder="Optionnel"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            </div>
            {error ? (
              <p role="status" aria-live="polite" className="text-sm text-red-600">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Annuler
              </Button>
              <Button onClick={confirm} disabled={isPending}>
                Confirmer ma signature
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
