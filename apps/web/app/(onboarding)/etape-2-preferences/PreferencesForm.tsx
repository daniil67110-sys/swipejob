'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Euro,
  Laptop,
  MapPin,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { updatePreferencesAction, type UpdatePreferencesInput } from './actions';
import { CitiesMultiAutocomplete, type CityGeo } from './CitiesMultiAutocomplete';

const CONTRACT_TYPES = ['stage', 'alternance'];
const DURATIONS = ['1-3 mois', '3-6 mois', '6-12 mois', '12+ mois'];
const WORK_MODES = ['on-site', 'hybrid', 'remote'];

const LABELS: Record<string, string> = {
  stage: 'Stage',
  alternance: 'Alternance',
  'on-site': 'Sur site',
  hybrid: 'Hybride',
  remote: 'Télétravail',
  tech: 'Tech',
  finance: 'Finance',
  marketing: 'Marketing',
  conseil: 'Conseil',
  industrie: 'Industrie',
  santé: 'Santé',
  public: 'Public',
  autre: 'Autre',
  TPE: 'Très petite',
  PME: 'PME',
  ETI: 'Intermédiaire',
  grandes: 'Grande',
};

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
  citiesGeo: CityGeo[];
  geoRadiusKm: number;
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

  const { handleSubmit, setValue, watch, register } = useForm<FormValues>({
    defaultValues: {
      contractTypes: initial.contractTypes ?? [],
      durations: initial.durations ?? [],
      citiesGeo: initial.citiesGeo ?? [],
      geoRadiusKm: initial.geoRadiusKm ?? 50,
      workModes: initial.workModes ?? [],
      sectors: initial.sectors ?? [],
      companySizes: initial.companySizes ?? [],
      salaryMinMonthly: initial.salaryMinMonthly,
      salaryMaxMonthly: initial.salaryMaxMonthly,
      desiredStartDate: initial.desiredStartDate ?? '',
    },
  });

  const contractTypes = watch('contractTypes');
  const durations = watch('durations');
  const workModes = watch('workModes');
  const sectors = watch('sectors');
  const companySizes = watch('companySizes');
  const geoRadiusKm = watch('geoRadiusKm');

  const toggle = (
    name: 'contractTypes' | 'durations' | 'workModes' | 'sectors' | 'companySizes',
    value: string,
  ) => {
    const current = watch(name);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setValue(name, next, { shouldDirty: true });
  };

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    const cleanNum = (n: number | undefined): number | null =>
      typeof n === 'number' && Number.isFinite(n) ? n : null;

    const input: UpdatePreferencesInput = {
      contractTypes: values.contractTypes,
      durations: values.durations,
      cities: values.citiesGeo.map((c) => c.label),
      citiesGeo: values.citiesGeo,
      geoRadiusKm: cleanNum(values.geoRadiusKm) ?? 50,
      workModes: values.workModes,
      sectors: values.sectors,
      companySizes: values.companySizes,
      salaryMinMonthly: cleanNum(values.salaryMinMonthly),
      salaryMaxMonthly: cleanNum(values.salaryMaxMonthly),
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
      <Section icon={Briefcase} title="Type de contrat">
        <PillGroup
          options={CONTRACT_TYPES}
          selected={contractTypes}
          onToggle={(v) => toggle('contractTypes', v)}
        />
      </Section>

      <Section icon={Clock} title="Durée souhaitée">
        <PillGroup
          options={DURATIONS}
          selected={durations}
          onToggle={(v) => toggle('durations', v)}
        />
      </Section>

      <Section icon={MapPin} title="Villes">
        <CitiesMultiAutocomplete
          defaultGeo={watch('citiesGeo') ?? []}
          onChange={(geo) =>
            setValue('citiesGeo', geo, { shouldDirty: true, shouldValidate: true })
          }
        />
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="geoRadius" className="text-xs font-medium text-neutral-700">
              Rayon de recherche
            </label>
            <span className="text-xs font-semibold tabular-nums text-orange-600">
              {geoRadiusKm} km
            </span>
          </div>
          <input
            id="geoRadius"
            type="range"
            min={0}
            max={200}
            step={5}
            className="range-orange w-full"
            {...register('geoRadiusKm', { valueAsNumber: true })}
          />
        </div>
      </Section>

      <Section icon={Laptop} title="Mode de travail">
        <PillGroup
          options={WORK_MODES}
          selected={workModes}
          onToggle={(v) => toggle('workModes', v)}
        />
      </Section>

      <Section icon={Sparkles} title="Secteurs">
        <PillGroup options={SECTORS} selected={sectors} onToggle={(v) => toggle('sectors', v)} />
      </Section>

      <Section icon={Building2} title="Taille d'entreprise">
        <PillGroup
          options={COMPANY_SIZES}
          selected={companySizes}
          onToggle={(v) => toggle('companySizes', v)}
        />
      </Section>

      <Section icon={Euro} title="Salaire (€/mois, optionnel)">
        <p className="mb-3 text-xs text-neutral-500">
          Laisse vide si tu n&apos;es pas sûr·e — la gratification de stage et la rémunération
          d&apos;alternance sont encadrées par la loi.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label
              htmlFor="salaryMin"
              className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
            >
              Minimum
            </label>
            <div className="relative">
              <input
                id="salaryMin"
                type="number"
                min={0}
                max={100_000}
                placeholder="1 000"
                className="block w-full rounded-2xl border border-neutral-200 bg-white pl-8 pr-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
                {...register('salaryMinMonthly', { valueAsNumber: true })}
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                €
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="salaryMax"
              className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
            >
              Maximum
            </label>
            <div className="relative">
              <input
                id="salaryMax"
                type="number"
                min={0}
                max={100_000}
                placeholder="3 000"
                className="block w-full rounded-2xl border border-neutral-200 bg-white pl-8 pr-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
                {...register('salaryMaxMonthly', { valueAsNumber: true })}
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                €
              </span>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={Calendar} title="Date de démarrage souhaitée">
        <input
          type="date"
          className="block w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
          {...register('desiredStartDate')}
        />
      </Section>

      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-[44px] w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {isPending ? 'Enregistrement…' : 'Enregistrer mes préférences'}
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

      <style jsx global>{`
        .range-orange {
          appearance: none;
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            #f97316 0%,
            #f97316 ${(geoRadiusKm / 200) * 100}%,
            #e5e5e5 ${(geoRadiusKm / 200) * 100}%,
            #e5e5e5 100%
          );
          outline: none;
        }
        .range-orange::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: #171717;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
          cursor: pointer;
          transition: transform 120ms ease-out;
        }
        .range-orange::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .range-orange::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: #171717;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
          cursor: pointer;
        }
      `}</style>
    </form>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f7f5f1] ring-1 ring-neutral-200">
          <Icon className="h-4 w-4 text-neutral-700" aria-hidden="true" />
        </span>
        <span className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-neutral-900">
          {title}
        </span>
      </legend>
      {children}
    </fieldset>
  );
}

function PillGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? 'bg-neutral-900 text-white shadow-sm ring-1 ring-neutral-900'
                : 'bg-[#f7f5f1] text-neutral-700 ring-1 ring-neutral-200 hover:bg-white hover:ring-orange-300'
            }`}
          >
            {isActive ? (
              <span aria-hidden="true" className="text-xs leading-none">
                ✓
              </span>
            ) : null}
            {LABELS[opt] ?? opt}
          </button>
        );
      })}
    </div>
  );
}
