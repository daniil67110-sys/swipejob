'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Download,
  Instagram,
  LayoutDashboard,
  Linkedin,
  PartyPopper,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trackWrappedShareAction } from '@/app/(app)/wrapped/actions';
import type { WrappedData } from '@/lib/wrapped';

type Props = {
  data: WrappedData;
};

const STAGGER = 0.08;

export function WrappedShareView({ data }: Props) {
  const router = useRouter();
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const ogImageUrl = `/wrapped/${data.applicationId}/og`;
  const linkedinText = buildLinkedInText(data);
  const linkedinShareUrl = (origin: string) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(origin + '/wrapped/' + data.applicationId)}`;

  const handleInstagramShare = async () => {
    void trackWrappedShareAction({ channel: 'instagram', applicationId: data.applicationId });
    try {
      const res = await fetch(ogImageUrl);
      const blob = await res.blob();
      const file = new File([blob], `swipejob-wrapped.png`, { type: blob.type || 'image/png' });
      if (canNativeShare && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "C'est signé !",
          text: `Je viens de signer chez ${data.companyName} grâce à SwipeJob.`,
        });
        return;
      }
      downloadBlob(blob, 'swipejob-wrapped.png');
    } catch {
      // utilisateur a annulé — silencieux
    }
  };

  const handleLinkedInShare = () => {
    void trackWrappedShareAction({ channel: 'linkedin', applicationId: data.applicationId });
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    window.open(linkedinShareUrl(origin), '_blank', 'noopener,noreferrer');
  };

  const handleInviteFriends = () => {
    void trackWrappedShareAction({ channel: 'invite', applicationId: data.applicationId });
    router.push('/profil/parrainage');
  };

  const handleDashboard = () => {
    void trackWrappedShareAction({ channel: 'dashboard', applicationId: data.applicationId });
    router.push('/candidatures');
  };

  const handleDownload = async () => {
    void trackWrappedShareAction({ channel: 'download', applicationId: data.applicationId });
    try {
      const res = await fetch(ogImageUrl);
      const blob = await res.blob();
      downloadBlob(blob, 'swipejob-wrapped.png');
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="relative min-h-dvh overflow-hidden text-white"
      style={{ backgroundColor: '#0D0D14' }}
    >
      <ConfettiBackdrop />

      <div className="relative mx-auto max-w-2xl space-y-10 px-6 py-12 sm:py-16">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="space-y-4 text-center"
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}
            className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 shadow-xl"
            aria-hidden="true"
          >
            <PartyPopper className="h-10 w-10" strokeWidth={2.25} />
          </motion.div>
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-white/70">
            C&apos;est signé !
          </p>
          <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Tu as signé chez{' '}
            <span className="block italic text-orange-400 sm:inline">{data.companyName}</span>
          </h1>
          <p className="mx-auto max-w-md text-heading-md font-medium text-white/85">
            {data.jobTitle}
          </p>
        </motion.header>

        {/* Stats grid */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: STAGGER, delayChildren: 0.4 } },
          }}
          className="grid grid-cols-3 gap-3 sm:gap-4"
          aria-label="Statistiques de mon parcours"
        >
          <StatCard label="Jours" sublabel="de recherche" value={data.searchDurationDays} />
          <StatCard label="Candidatures" sublabel="envoyées" value={data.applicationsSent} />
          <StatCard label="Entretiens" sublabel="décrochés" value={data.interviewsScheduled} />
        </motion.section>

        {/* Preview image OG */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="space-y-3"
          aria-label="Aperçu Instagram Story"
        >
          <p className="text-center text-caption font-semibold uppercase tracking-[0.18em] text-white/70">
            Image prête à partager
          </p>
          <div
            className="rounded-3xl p-3 shadow-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ogImageUrl}
              alt={`Carte de partage : signé chez ${data.companyName}`}
              className="mx-auto w-full max-w-[280px] rounded-2xl shadow-md"
              loading="eager"
            />
          </div>
        </motion.section>

        {/* Share buttons */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06, delayChildren: 1.0 } },
          }}
          className="space-y-3"
          aria-label="Options de partage"
        >
          <ShareButton
            onClick={handleInstagramShare}
            icon={<Instagram className="h-5 w-5" aria-hidden="true" />}
            label="Partager en Instagram Story"
            primary
          />
          <div className="grid grid-cols-2 gap-3">
            <ShareButton
              onClick={handleLinkedInShare}
              icon={<Linkedin className="h-5 w-5" aria-hidden="true" />}
              label="Post LinkedIn"
            />
            <ShareButton
              onClick={handleDownload}
              icon={<Download className="h-5 w-5" aria-hidden="true" />}
              label="Télécharger"
            />
          </div>
          <ShareButton
            onClick={handleInviteFriends}
            icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
            label="Inviter un pote"
          />
        </motion.section>

        {/* Pre-filled LinkedIn text */}
        <motion.details
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="overflow-hidden rounded-3xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-body-sm font-semibold">
            <span>Texte pré-rédigé pour LinkedIn</span>
            <ArrowRight className="h-4 w-4 transition-transform" aria-hidden="true" />
          </summary>
          <div className="border-t border-white/15 px-4 py-3">
            <textarea
              className="min-h-[140px] w-full resize-y rounded-2xl p-3 font-sans text-body-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-500/60"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              defaultValue={linkedinText}
              aria-label="Texte LinkedIn modifiable"
            />
            <p className="mt-2 text-caption text-white/75">
              Modifie le texte, copie-le, puis clique sur « Post LinkedIn ».
            </p>
          </div>
        </motion.details>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="pt-2 text-center"
        >
          <Link
            href="/candidatures"
            onClick={handleDashboard}
            className="inline-flex items-center gap-2 text-body-sm font-semibold text-white/85 transition-colors hover:text-orange-400 hover:underline"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Retour au dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ label, sublabel, value }: { label: string; sublabel: string; value: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.9 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      className="rounded-3xl p-4 text-center shadow-md sm:p-5"
      style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
    >
      <p
        className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-none tabular-nums sm:text-6xl"
        aria-label={`${value} ${label.toLowerCase()} ${sublabel}`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-caption font-semibold text-white/85">{label}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-white/65">{sublabel}</p>
    </motion.div>
  );
}

function ShareButton({
  onClick,
  icon,
  label,
  primary,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-body-md font-semibold shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${
        primary ? 'bg-orange-500 text-white hover:bg-orange-600' : 'text-white hover:bg-white/15'
      }`}
      style={primary ? undefined : { backgroundColor: 'rgba(255,255,255,0.08)' }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

function ConfettiBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => {
        const left = (i * 37) % 100;
        const delay = (i % 8) * 0.4;
        const duration = 6 + (i % 5);
        return (
          <motion.div
            key={i}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: ['0%', '110vh'], opacity: [0, 1, 1, 0] }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute h-2 w-2 rounded-sm"
            style={{
              left: `${left}%`,
              top: '-10px',
              backgroundColor: ['#F97316', '#FB923C', '#FED7AA', '#FFFFFF'][i % 4],
            }}
          />
        );
      })}
    </div>
  );
}

function buildLinkedInText(data: WrappedData): string {
  return `Je viens de signer chez ${data.companyName} pour le poste de ${data.jobTitle} 🎉

${data.searchDurationDays} jours de recherche, ${data.applicationsSent} candidatures envoyées, ${data.interviewsScheduled} entretien${data.interviewsScheduled > 1 ? 's' : ''} décroché${data.interviewsScheduled > 1 ? 's' : ''}.

J'ai utilisé SwipeJob pour automatiser les candidatures (swipe + lettre IA + dashboard). Un gain de temps énorme pour ceux qui cherchent un stage ou une alternance.

#stage #alternance #premieremplooi`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
