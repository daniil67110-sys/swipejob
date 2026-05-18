'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { updatePreferencesAction, type UpdatePreferencesInput } from './actions';

const CONTRACT_TYPES = ['stage', 'alternance'];
const DURATIONS = ['1-3 mois', '3-6 mois', '6-12 mois', '12+ mois'];
const WORK_MODES = ['on-site', 'hybrid', 'remote'];
const SECTORS = [
  'tech',
  'finance',
  'marketing',
  'conseil',
  'industrie',
  'santé',
  'public',
  'autre',
];
const COMPANY_SIZES = ['TPE', 'PME', 'ETI', 'grandes'];

type FormValues = {
  contractTypes: string[];
  durations: string[];
  citiesCsv: string;
  geoRadiusKm: number | undefined;
  workModes: string[];
  sectors: string[];
  companySizes: string[];
  salaryMinMonthly: number | undefined;
  salaryMaxMonthly: number | undefined;
  desiredStartDate: string;
};

export function PreferencesForm({ initial }: { initial: Partial<FormValues> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      contractTypes: initial.contractTypes ?? [],
      durations: initial.durations ?? [],
      citiesCsv: initial.citiesCsv ?? '',
      geoRadiusKm: initial.geoRadiusKm ?? 50,
      workModes: initial.workModes ?? [],
      sectors: initial.sectors ?? [],
      companySizes: initial.companySizes ?? [],
      salaryMinMonthly: initial.salaryMinMonthly,
      salaryMaxMonthly: initial.salaryMaxMonthly,
      desiredStartDate: initial.desiredStartDate ?? '',
    },
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    const cities = values.citiesCsv
      ? values.citiesCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const input: UpdatePreferencesInput = {
      contractTypes: values.contractTypes,
      durations: values.durations,
      cities,
      geoRadiusKm: values.geoRadiusKm ?? 50,
      workModes: values.workModes,
      sectors: values.sectors,
      companySizes: values.companySizes,
      salaryMinMonthly: values.salaryMinMonthly ?? null,
      salaryMaxMonthly: values.salaryMaxMonthly ?? null,
      desiredStartDate: values.desiredStartDate || null,
    };

    startTransition(async () => {
      const res = await updatePreferencesAction(input);
      if (res.ok) {
        router.push(res.data.redirectTo);
      } else {
        setServerError(res.error.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Section title="Type de contrat">
        <CheckGroup name="contractTypes" options={CONTRACT_TYPES} register={register} />
      </Section>

      <Section title="Durée souhaitée">
        <CheckGroup name="durations" options={DURATIONS} register={register} />
      </Section>

      <Section title="Villes (séparées par des virgules)">
        <input
          type="text"
          placeholder="Paris, Lyon, Lille"
          className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[44px]"
          {...register('citiesCsv')}
        />
        <label className="mt-2 block text-sm">
          Rayon (km) :
          <input
            type="number"
            min={0}
            max={500}
            className="ml-2 w-24 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            {...register('geoRadiusKm', { valueAsNumber: true })}
          />
        </label>
      </Section>

      <Section title="Mode de travail">
        <CheckGroup name="workModes" options={WORK_MODES} register={register} />
      </Section>

      <Section title="Secteurs">
        <CheckGroup name="sectors" options={SECTORS} register={register} />
      </Section>

      <Section title="Taille d'entreprise">
        <CheckGroup name="companySizes" options={COMPANY_SIZES} register={register} />
      </Section>

      <Section title="Salaire (€/mois, optionnel)">
        <div className="flex gap-3 items-center">
          <label className="text-sm">
            Min :
            <input
              type="number"
              min={0}
              max={100_000}
              placeholder="ex 1000"
              className="ml-2 w-32 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              {...register('salaryMinMonthly', { valueAsNumber: true })}
            />
          </label>
          <label className="text-sm">
            Max :
            <input
              type="number"
              min={0}
              max={100_000}
              placeholder="ex 3000"
              className="ml-2 w-32 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              {...register('salaryMaxMonthly', { valueAsNumber: true })}
            />
          </label>
        </div>
      </Section>

      <Section title="Date de démarrage souhaitée">
        <input
          type="date"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          {...register('desiredStartDate')}
        />
      </Section>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-md bg-primary-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
      >
        {isPending ? 'Enregistrement…' : 'Enregistrer mes préférences'}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2 rounded-md border border-neutral-200 bg-white p-4">
      <legend className="text-sm font-medium text-neutral-900 px-1">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckGroup({
  name,
  options,
  register,
}: {
  name: 'contractTypes' | 'durations' | 'workModes' | 'sectors' | 'companySizes';
  options: string[];
  register: ReturnType<typeof useForm<FormValues>>['register'];
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            value={opt}
            className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
            {...register(name)}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}
