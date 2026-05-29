'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CheckCircle2, FileText, Shield, Sparkles, TrendingUp } from 'lucide-react';
import { AnimatedWords } from './AnimatedWords';
import { FloatingBadge } from './FloatingBadge';
import { SwipeLoopMockup } from './SwipeLoopMockup';

export function LandingHero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[#f7f5f1] pt-10 pb-20 lg:pt-16 lg:pb-32">
      {/* Soft background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Eyebrow */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex justify-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-caption font-medium tracking-wide text-neutral-700 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-primary-500" aria-hidden="true" />
            Recherche d&apos;emploi nouvelle génération
          </span>
        </motion.div>

        {/* Editorial heading */}
        <h1
          className="mx-auto max-w-4xl text-center font-[family-name:var(--font-fraunces)] text-[44px] leading-[1.02] tracking-tight text-neutral-900 sm:text-[64px] lg:text-[88px]"
          style={{ fontWeight: 500 }}
        >
          <AnimatedWords
            segments={[
              { text: "L'alternance", emphasis: true },
              { text: 'qui', emphasis: false },
              { text: 'te ressemble', emphasis: true },
              { text: 'vraiment', emphasis: false },
            ]}
            emphasisClassName="text-neutral-900 font-semibold italic"
            mutedClassName="text-neutral-400 font-light"
            delay={0.3}
          />
        </h1>

        {/* Constellation : phone + floating cards */}
        <div className="relative mt-14 lg:mt-20">
          {/* Phone (always centered) */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-auto"
          >
            <SwipeLoopMockup />
          </motion.div>

          {/* Floating cards — desktop only */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            {/* Top left — Coach IA */}
            <FloatingBadge
              className="pointer-events-auto absolute left-[6%] top-[10%]"
              delay={1}
              floatDelay={0}
              floatAmplitude={6}
            >
              <div className="flex items-center gap-3 p-3 pr-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-neutral-900">Matching IA</p>
                  <p className="text-caption text-neutral-500">Score sur 100 par offre</p>
                </div>
              </div>
            </FloatingBadge>

            {/* Top right — 3 avatars / preuves sociales */}
            <FloatingBadge
              className="pointer-events-auto absolute right-[6%] top-[14%]"
              delay={1.15}
              floatDelay={1}
              floatAmplitude={7}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex -space-x-2">
                  <span className="h-8 w-8 rounded-full bg-gradient-to-br from-info-400 to-info-600 ring-2 ring-white" />
                  <span className="h-8 w-8 rounded-full bg-gradient-to-br from-success-400 to-success-600 ring-2 ring-white" />
                  <span className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 ring-2 ring-white" />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-neutral-900">+1 200 jeunes</p>
                  <p className="text-caption text-neutral-500">déjà sur la beta</p>
                </div>
              </div>
            </FloatingBadge>

            {/* Bottom left — Stats */}
            <FloatingBadge
              className="pointer-events-auto absolute left-[4%] bottom-[10%]"
              delay={1.3}
              floatDelay={2}
              floatAmplitude={8}
            >
              <div className="flex items-center gap-3 p-3 pr-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-primary-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-display-md font-bold leading-none text-neutral-900">5 000+</p>
                  <p className="text-caption text-neutral-500">offres actives</p>
                </div>
              </div>
            </FloatingBadge>

            {/* Bottom right — Lettre IA */}
            <FloatingBadge
              className="pointer-events-auto absolute right-[5%] bottom-[14%]"
              delay={1.45}
              floatDelay={1.5}
              floatAmplitude={6}
            >
              <div className="flex items-center gap-3 p-3 pr-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 text-white">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-neutral-900">Lettre IA</p>
                  <p className="text-caption text-neutral-500">générée en 3 secondes</p>
                </div>
              </div>
            </FloatingBadge>
          </div>
        </div>

        {/* CTAs */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mt-14 flex flex-col items-center gap-4"
        >
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/inscription"
              className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-neutral-900 px-7 py-3.5 text-body-md font-semibold text-white shadow-[0_8px_30px_-8px_rgba(0,0,0,0.4)] transition-all duration-200 hover:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.5)] hover:-translate-y-0.5"
            >
              S&apos;inscrire gratuitement
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/connexion"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-neutral-300 bg-white/70 px-6 py-3.5 text-body-md font-semibold text-neutral-800 backdrop-blur-sm transition-colors hover:bg-white"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-caption text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success-500" aria-hidden="true" />
              100 % gratuit
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-info-500" aria-hidden="true" />
              Données en UE · RGPD
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
              Sans CB, sans CV public
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
