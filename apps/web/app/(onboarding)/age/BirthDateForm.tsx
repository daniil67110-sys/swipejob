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
          className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[44px]"
          {...register('birthDate')}
        />
        {errors.birthDate ? (
          <p id="birthDate-error" className="text-xs text-error-500">
            {errors.birthDate.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending || !isValid}
        className="flex w-full items-center justify-center rounded-md bg-primary-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
      >
        {isPending ? 'Validation…' : 'Continuer'}
      </button>

      {serverError ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md border border-error-500/40 bg-error-100 p-3 text-sm text-error-500"
        >
          {serverError}
        </div>
      ) : null}
    </form>
  );
}
