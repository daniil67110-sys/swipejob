'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { updateConsentAction } from './actions';
import type { ConsentDef, ConsentPurpose, ConsentState } from '@/lib/consents';

type Props = {
  catalog: readonly ConsentDef[];
  initial: ConsentState;
};

export function ConsentToggles({ catalog, initial }: Props) {
  const router = useRouter();
  const [state, setState] = useState<ConsentState>(initial);
  const [pending, setPending] = useState<ConsentPurpose | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onToggle = (purpose: ConsentPurpose, next: boolean) => {
    setError(null);
    setPending(purpose);
    const previous = state[purpose];
    setState({ ...state, [purpose]: next });
    startTransition(async () => {
      const res = await updateConsentAction({ purpose, granted: next });
      setPending(null);
      if (!res.ok) {
        setError(res.error.message);
        setState((s) => ({ ...s, [purpose]: previous }));
        return;
      }
      router.refresh();
    });
  };

  return (
    <ul className="space-y-3">
      {catalog.map((c) => {
        const checked = state[c.code];
        const isPending = pending === c.code;
        const locked = c.required || c.comingSoon;
        return (
          <li key={c.code} className="rounded-xl border border-neutral-100 bg-neutral-50/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-body-md font-semibold text-neutral-900">{c.title}</h3>
                  {c.required ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-600 text-[11px] font-semibold">
                      <Lock className="w-3 h-3" aria-hidden="true" />
                      Obligatoire
                    </span>
                  ) : null}
                  {c.comingSoon ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-100 text-warning-500 text-[11px] font-semibold">
                      Bientôt
                    </span>
                  ) : null}
                  <span className="text-[11px] text-neutral-400 font-mono">
                    art. 6.1.{c.legalBasis}
                  </span>
                </div>
                <p className="text-caption text-neutral-600 mt-1.5 leading-relaxed">
                  {c.description}
                </p>
              </div>
              <Switch
                checked={checked}
                disabled={locked || isPending}
                onCheckedChange={(v) => onToggle(c.code, v)}
                aria-label={c.title}
              />
            </div>
          </li>
        );
      })}
      {error ? (
        <li role="alert" className="flex items-start gap-2 text-body-sm text-error-500">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </li>
      ) : null}
    </ul>
  );
}
