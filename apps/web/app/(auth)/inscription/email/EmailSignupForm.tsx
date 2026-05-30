'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signupWithEmailAction } from './actions';

const schema = z.object({
  email: z.string().email("Email invalide. Vérifie qu'il a la forme nom@domaine.fr."),
  password: z
    .string()
    .min(10, 'Au moins 10 caractères.')
    .regex(/[a-zA-Z]/, 'Au moins une lettre.')
    .regex(/[0-9]/, 'Au moins un chiffre.'),
});

type FormValues = z.infer<typeof schema>;

export function EmailSignupForm() {
  const [isPending, startTransition] = useTransition();
  const [serverMessage, setServerMessage] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const onSubmit = (values: FormValues) => {
    setServerMessage(null);
    startTransition(async () => {
      const res = await signupWithEmailAction(values);
      if (res.ok) {
        setServerMessage({ kind: 'success', text: res.data.message });
      } else {
        setServerMessage({ kind: 'error', text: res.error.message });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-caption font-semibold uppercase tracking-[0.14em] text-neutral-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="ton.email@exemple.fr"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="block min-h-[48px] w-full rounded-2xl border border-neutral-200 bg-[#fafaf8] px-4 py-3 text-body-md text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/15"
          {...register('email')}
        />
        {errors.email ? (
          <p id="email-error" className="text-caption font-medium text-red-600">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-caption font-semibold uppercase tracking-[0.14em] text-neutral-700"
        >
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : 'password-hint'}
          className="block min-h-[48px] w-full rounded-2xl border border-neutral-200 bg-[#fafaf8] px-4 py-3 text-body-md text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/15"
          {...register('password')}
        />
        {errors.password ? (
          <p id="password-error" className="text-caption font-medium text-red-600">
            {errors.password.message}
          </p>
        ) : (
          <p id="password-hint" className="text-caption text-neutral-500">
            Au moins 10 caractères, avec lettres et chiffres.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !isValid}
        className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3.5 text-body-md font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-4 focus:ring-orange-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {isPending ? 'Envoi en cours…' : 'Créer mon compte →'}
      </button>

      {serverMessage ? (
        <div
          role="alert"
          aria-live="polite"
          className={
            serverMessage.kind === 'success'
              ? 'rounded-2xl border border-success-200 bg-success-50 p-3 text-body-sm text-success-700'
              : 'rounded-2xl border border-red-200 bg-red-50 p-3 text-body-sm text-red-700'
          }
        >
          {serverMessage.text}
        </div>
      ) : null}
    </form>
  );
}
