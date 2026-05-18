'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginWithEmailAction } from './actions';

const schema = z.object({
  email: z.string().email('Email invalide.'),
  password: z.string().min(1, 'Mot de passe requis.'),
});
type FormValues = z.infer<typeof schema>;

export function EmailLoginForm() {
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
      const res = await loginWithEmailAction(values);
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
        <label htmlFor="login-email" className="block text-sm font-medium text-neutral-900">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[44px]"
          {...register('email')}
        />
        {errors.email ? (
          <p id="login-email-error" className="text-xs text-error-500">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="login-password" className="block text-sm font-medium text-neutral-900">
          Mot de passe
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
          className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[44px]"
          {...register('password')}
        />
        {errors.password ? (
          <p id="login-password-error" className="text-xs text-error-500">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending || !isValid}
        className="flex w-full items-center justify-center rounded-md bg-primary-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
      >
        {isPending ? 'Connexion…' : 'Se connecter'}
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
