'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfileAction } from './actions';
import { CityAutocomplete } from './CityAutocomplete';

const schema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  headline: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  phone: z.string().max(30).optional(),
  city: z.string().max(120).optional(),
  linkedinUrl: z
    .union([z.string().url('URL invalide'), z.literal('')])
    .optional()
    .or(z.string().optional()),
});
type FormValues = z.infer<typeof schema>;

export function ReviewCvForm({ initial }: { initial: FormValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: initial,
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      const res = await updateProfileAction(values);
      if (res.ok) {
        router.push(res.data.redirectTo);
      } else {
        setServerError(res.error.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field
        label="Prénom"
        id="firstName"
        register={register('firstName')}
        error={errors.firstName?.message}
      />
      <Field
        label="Nom"
        id="lastName"
        register={register('lastName')}
        error={errors.lastName?.message}
      />
      <Field
        label="Titre (ex: Étudiant Master 2 Marketing)"
        id="headline"
        register={register('headline')}
        error={errors.headline?.message}
      />
      <Field
        label="Téléphone"
        id="phone"
        register={register('phone')}
        error={errors.phone?.message}
      />
      <CityAutocomplete<FormValues>
        defaultValue={initial.city}
        register={register('city')}
        setValue={setValue}
        error={errors.city?.message}
      />
      <Field
        label="LinkedIn (URL)"
        id="linkedinUrl"
        register={register('linkedinUrl')}
        error={errors.linkedinUrl?.message}
      />
      <div className="space-y-1">
        <label htmlFor="summary" className="block text-sm font-medium text-neutral-900">
          Résumé / bio (1-2 phrases)
        </label>
        <textarea
          id="summary"
          rows={4}
          className="block w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
          {...register('summary')}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !isValid}
        className="flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
      >
        {isPending ? 'Enregistrement…' : 'Valider et continuer'}
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

type RegisterReturn = ReturnType<ReturnType<typeof useForm<FormValues>>['register']>;

function Field({
  label,
  id,
  register,
  error,
}: {
  label: string;
  id: string;
  register: RegisterReturn;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-neutral-900">
        {label}
      </label>
      <input
        id={id}
        type="text"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="block w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15 min-h-[44px]"
        {...register}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
