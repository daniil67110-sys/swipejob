'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitBirthDateAction } from './actions';

const schema = z.object({
  birthDate: z.string().min(1, 'Date requise'),
});
type FormValues = z.infer<typeof schema>;

export function BirthDateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const maxDate = new Date().toISOString().slice(0, 10);
  const minDate = new Date(Date.now() - 120 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      const res = await submitBirthDateAction(values);
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
        <label htmlFor="birthDate" className="block text-sm font-medium text-neutral-900">
          Date de naissance
        </label>
        <input
          id="birthDate"
          type="date"
          min={minDate}
          max={maxDate}
          aria-invalid={Boolean(errors.birthDate)}
          aria-describedby={errors.birthDate ? 'birthDate-error' : undefined}
          className="block w-full min-h-[44px] rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
          {...register('birthDate')}
        />
        {errors.birthDate ? (
          <p id="birthDate-error" className="text-xs text-red-600">
            {errors.birthDate.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending || !isValid}
        className="flex min-h-[44px] w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {isPending ? 'Validation…' : 'Continuer'}
      </button>

      {serverError ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      ) : null}
    </form>
  );
}
