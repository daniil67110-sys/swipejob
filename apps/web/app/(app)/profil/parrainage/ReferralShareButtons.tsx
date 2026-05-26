'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Mail, MessageSquare, Share2 } from 'lucide-react';
import { trackReferralShareAction } from './actions';

type Props = {
  url: string;
  code: string;
};

const WHATSAPP_TEXT = encodeURIComponent(
  'Salut ! J’ai trouvé une app pour candidater à des stages/alternances en swipant — tu vas adorer. Inscris-toi via mon lien :',
);
const SMS_TEXT = encodeURIComponent(
  'Découvre SwipeJob — candidate à des stages en swipant. Mon lien :',
);
const EMAIL_SUBJECT = encodeURIComponent('Une app pour chercher mon stage en swipant');
const EMAIL_BODY = encodeURIComponent(
  "Salut !\n\nJe viens de découvrir SwipeJob, une app pour candidater à des stages/alternances en swipant comme sur Tinder. C'est rapide, l'IA personnalise les offres et écrit ta lettre. Tu devrais essayer :\n\n",
);

export function ReferralShareButtons({ url, code }: Props) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const track = (channel: 'copy' | 'native' | 'whatsapp' | 'sms' | 'email') => {
    void trackReferralShareAction({ channel, code });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track('copy');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback : sélectionne le texte pour copie manuelle.
      const range = document.createRange();
      const sel = window.getSelection();
      const node = document.getElementById('referral-url');
      if (node && sel) {
        range.selectNodeContents(node);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: 'Rejoins SwipeJob',
        text: 'Mon lien pour découvrir SwipeJob (candidater en swipant)',
        url,
      });
      track('native');
    } catch {
      // Annulation utilisateur — silencieux
    }
  };

  return (
    <div className="space-y-4">
      {/* URL pill */}
      <div className="flex items-stretch gap-2">
        <div
          id="referral-url"
          className="flex-1 min-w-0 rounded-xl bg-gradient-to-r from-info-50 to-success-50 border border-info-100 px-4 py-3 font-mono text-body-sm text-neutral-900 truncate select-all"
          aria-label="Mon lien de parrainage"
        >
          {url}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 rounded-xl bg-neutral-900 text-white text-body-sm font-semibold hover:bg-neutral-800 active:scale-95 transition-all min-w-[100px]"
          aria-label={copied ? 'Copié' : 'Copier le lien'}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" aria-hidden="true" />
              Copié
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" aria-hidden="true" />
              Copier
            </>
          )}
        </button>
      </div>

      {/* Channels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <ShareLink
          href={`https://wa.me/?text=${WHATSAPP_TEXT}%20${encodeURIComponent(url)}`}
          onClick={() => track('whatsapp')}
          label="WhatsApp"
          icon={<WhatsappIcon />}
          colorClass="bg-[#25D366]/10 text-[#1ea854] hover:bg-[#25D366]/20"
        />
        <ShareLink
          href={`sms:?&body=${SMS_TEXT}%20${encodeURIComponent(url)}`}
          onClick={() => track('sms')}
          label="SMS"
          icon={<MessageSquare className="w-4 h-4" aria-hidden="true" />}
          colorClass="bg-info-100 text-info-500 hover:bg-info-100/70"
        />
        <ShareLink
          href={`mailto:?subject=${EMAIL_SUBJECT}&body=${EMAIL_BODY}${encodeURIComponent(url)}`}
          onClick={() => track('email')}
          label="Email"
          icon={<Mail className="w-4 h-4" aria-hidden="true" />}
          colorClass="bg-primary-100 text-primary-500 hover:bg-primary-100/70"
        />
        {canNativeShare ? (
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-accent-100 text-accent-500 hover:bg-accent-100/70 text-body-sm font-semibold transition-all min-h-[44px]"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
            Partager
          </button>
        ) : (
          <ShareLink
            href={url}
            onClick={() => track('native')}
            label="Ouvrir"
            icon={<Share2 className="w-4 h-4" aria-hidden="true" />}
            colorClass="bg-accent-100 text-accent-500 hover:bg-accent-100/70"
            external
          />
        )}
      </div>

      <p className="text-caption text-neutral-500">
        Code : <span className="font-mono font-semibold tracking-wider">{code}</span>
      </p>
    </div>
  );
}

function ShareLink({
  href,
  onClick,
  label,
  icon,
  colorClass,
  external,
}: {
  href: string;
  onClick?: () => void;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-body-sm font-semibold transition-all min-h-[44px] ${colorClass}`}
    >
      {icon}
      {label}
    </a>
  );
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.4 0 .04 5.36.03 11.96c0 2.11.55 4.17 1.6 5.98L0 24l6.22-1.63a12 12 0 0 0 5.78 1.48h.01c6.6 0 11.96-5.37 11.96-11.97 0-3.2-1.24-6.2-3.45-8.4ZM12 21.81h-.01c-1.78 0-3.52-.48-5.03-1.38l-.36-.21-3.7.97.99-3.6-.23-.37A9.94 9.94 0 0 1 2.03 12C2.04 6.49 6.51 2.03 12 2.03c2.66 0 5.16 1.04 7.04 2.92a9.92 9.92 0 0 1 2.92 7.05c0 5.51-4.47 9.81-9.96 9.81Zm5.46-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.27-.47-2.41-1.49-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.61-.91-2.21-.24-.58-.49-.5-.66-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.21 5.08 4.5.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.34Z" />
    </svg>
  );
}
