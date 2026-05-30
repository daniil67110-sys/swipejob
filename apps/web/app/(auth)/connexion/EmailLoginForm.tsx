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
      <div className="space-y-1.5">
        <label
          htmlFor="login-email"
          className="block text-caption font-semibold uppercase tracking-[0.14em] text-neutral-700"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          className="block min-h-[48px] w-full rounded-2xl border border-neutral-200 bg-[#fafaf8] px-4 py-3 text-body-md text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/15"
          {...register('email')}
        />
        {errors.email ? (
          <p id="login-email-error" className="text-caption font-medium text-red-600">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="login-password"
          className="block text-caption font-semibold uppercase tracking-[0.14em] text-neutral-700"
        >
          Mot de passe
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
          className="block min-h-[48px] w-full rounded-2xl border border-neutral-200 bg-[#fafaf8] px-4 py-3 text-body-md text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/15"
          {...register('password')}
        />
        {errors.password ? (
          <p id="login-password-error" className="text-caption font-medium text-red-600">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending || !isValid}
        className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3.5 text-body-md font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-4 focus:ring-orange-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {isPending ? 'Connexion…' : 'Se connecter →'}
      </button>

      {serverError ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-2xl border border-red-200 bg-red-50 p-3 text-body-sm text-red-700"
        >
          {serverError}
        </div>
      ) : null}
    </form>
  );
}
