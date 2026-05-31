'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { requestParentalConsentAction } from './actions';

const schema = z.object({
  parentName: z.string().min(2, 'Nom requis (min 2 caractères)').max(100),
  parentEmail: z.string().email('Email invalide'),
  confirmed: z.literal(true, { errorMap: () => ({ message: 'Confirmation requise.' }) }),
});
type FormValues = z.infer<typeof schema>;

export function ParentalConsentForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      const res = await requestParentalConsentAction(values);
      if (res.ok) {
        router.push(res.data.redirectTo);
      } else {
        setServerError(res.error.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="parentName" className="block text-sm font-medium text-neutral-900">
          Nom de ton parent ou tuteur légal
        </label>
        <input
          id="parentName"
          type="text"
          autoComplete="off"
          aria-invalid={Boolean(errors.parentName)}
          aria-describedby={errors.parentName ? 'parentName-error' : undefined}
          className="block w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15 min-h-[44px]"
          {...register('parentName')}
        />
        {errors.parentName ? (
          <p id="parentName-error" className="text-xs text-red-600">
            {errors.parentName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="parentEmail" className="block text-sm font-medium text-neutral-900">
          Son adresse email
        </label>
        <input
          id="parentEmail"
          type="email"
          autoComplete="off"
          aria-invalid={Boolean(errors.parentEmail)}
          aria-describedby={errors.parentEmail ? 'parentEmail-error' : undefined}
          className="block w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15 min-h-[44px]"
          {...register('parentEmail')}
        />
        {errors.parentEmail ? (
          <p id="parentEmail-error" className="text-xs text-red-600">
            {errors.parentEmail.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-start gap-2">
        <input
          id="confirmed"
          type="checkbox"
          aria-invalid={Boolean(errors.confirmed)}
          className="mt-1 h-4 w-4 rounded border-neutral-200 text-orange-600 focus:ring-orange-500/40"
          {...register('confirmed')}
        />
        <label htmlFor="confirmed" className="text-sm text-neutral-700">
          Je confirme que cette personne est mon parent ou tuteur légal et qu'elle a accepté de
          recevoir cet email.
        </label>
      </div>
      {errors.confirmed ? <p className="text-xs text-red-600">{errors.confirmed.message}</p> : null}

      <button
        type="submit"
        disabled={isPending || !isValid}
        className="flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
      >
        {isPending ? 'Envoi…' : 'Envoyer le lien à mon parent'}
      </button>

      {serverError ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {serverError}
        </div>
      ) : null}
    </form>
  );
}
