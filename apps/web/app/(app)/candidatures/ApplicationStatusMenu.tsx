'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PartyPopper } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateApplicationStatusAction } from './actions';
import { ReportSignatureModal } from './ReportSignatureModal';
import { MANUAL_STATUSES, statusLabel, type ApplicationStatus, type ManualStatus } from './lib';
import { StatusBadge } from './StatusBadge';
import { useBadgeUnlock } from '@/components/engagement/BadgeUnlockProvider';

const PICKABLE: ManualStatus[] = MANUAL_STATUSES.filter((s) => s !== 'signed') as ManualStatus[];

export function ApplicationStatusMenu({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const router = useRouter();
  const { trigger: triggerBadgeUnlock } = useBadgeUnlock();
  const [isPending, startTransition] = useTransition();
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [interviewAt, setInterviewAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<ApplicationStatus>(status);

  const apply = (next: ManualStatus, interview?: string) => {
    setError(null);
    setOptimisticStatus(next);
    startTransition(async () => {
      const res = await updateApplicationStatusAction({
        applicationId,
        status: next,
        ...(interview ? { interviewAt: interview } : {}),
      });
      if (!res.ok) {
        setOptimisticStatus(status);
        setError(res.error.message);
        return;
      }
      if (res.data.unlockedBadges?.length) triggerBadgeUnlock(res.data.unlockedBadges);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild aria-label="Modifier le statut" disabled={isPending}>
          <button className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full">
            <StatusBadge status={optimisticStatus} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {PICKABLE.map((s) => (
            <DropdownMenuItem
              key={s}
              onSelect={() => {
                if (s === 'interview_scheduled') {
                  setInterviewModalOpen(true);
                } else {
                  apply(s);
                }
              }}
            >
              {statusLabel(s)}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onSelect={() => setSignatureOpen(true)}
            className="text-orange-700 font-semibold flex items-center gap-2"
          >
            <PartyPopper className="w-4 h-4" aria-hidden="true" />
            Reporter ma signature
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error ? (
        <span role="status" aria-live="polite" className="text-xs text-red-600">
          {error}
        </span>
      ) : null}

      <Dialog open={interviewModalOpen} onOpenChange={setInterviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Date de l’entretien</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="interview-at">Quand est l’entretien ?</Label>
            <Input
              id="interview-at"
              type="datetime-local"
              value={interviewAt}
              onChange={(e) => setInterviewAt(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setInterviewModalOpen(false)}>
                Annuler
              </Button>
              <Button
                disabled={!interviewAt || isPending}
                onClick={() => {
                  const iso = new Date(interviewAt).toISOString();
                  setInterviewModalOpen(false);
                  apply('interview_scheduled', iso);
                }}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReportSignatureModal
        applicationId={applicationId}
        open={signatureOpen}
        onOpenChange={setSignatureOpen}
      />
    </div>
  );
}
