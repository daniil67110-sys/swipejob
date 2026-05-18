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
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-neutral-900">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="ton.email@exemple.fr"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[44px]"
          {...register('email')}
        />
        {errors.email ? (
          <p id="email-error" className="text-xs text-error-500">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-neutral-900">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : 'password-hint'}
          className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[44px]"
          {...register('password')}
        />
        {errors.password ? (
          <p id="password-error" className="text-xs text-error-500">
            {errors.password.message}
          </p>
        ) : (
          <p id="password-hint" className="text-xs text-neutral-500">
            Au moins 10 caractères, avec lettres et chiffres.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !isValid}
        className="flex w-full items-center justify-center rounded-md bg-primary-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
      >
        {isPending ? 'Envoi en cours…' : 'Créer mon compte'}
      </button>

      {serverMessage ? (
        <div
          role="alert"
          aria-live="polite"
          className={
            serverMessage.kind === 'success'
              ? 'rounded-md border border-success-500/40 bg-success-100 p-3 text-sm text-success-500'
              : 'rounded-md border border-error-500/40 bg-error-100 p-3 text-sm text-error-500'
          }
        >
          {serverMessage.text}
        </div>
      ) : null}
    </form>
  );
}
