'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Linkedin, Mail, MessageSquare, Share2, Twitter, X } from 'lucide-react';
import { shareOfferAction } from '@/app/(app)/deck/share-actions';

type Props = {
  offerId: string;
  offerTitle: string;
  offerCompany: string | null;
  /** URL publique `/offres/[slug]` absolue (avec SITE_URL). */
  url: string;
};

const SHARE_TEXT_TEMPLATE = (title: string, company: string | null) =>
  company
    ? `Je viens de tomber sur cette offre — "${title}" chez ${company}. Ça peut t'intéresser :`
    : `Je viens de tomber sur cette offre — "${title}". Ça peut t'intéresser :`;

type Channel = 'copy' | 'native' | 'whatsapp' | 'linkedin' | 'twitter' | 'email';

/**
 * Story 5.4 — Bouton + menu de partage anonyme d'une offre.
 * - URL `/offres/[slug]` ne contient aucun identifiant utilisateur.
 * - Compteur de partages incrémenté côté offre via shareOfferAction (anonyme).
 * - Si Web Share API dispo : utilise le partage natif en priorité.
 */
export function ShareOfferMenu({ offerId, offerTitle, offerCompany, url }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const track = (channel: Channel) => {
    void shareOfferAction({ offerId, channel });
  };

  const shareText = SHARE_TEXT_TEMPLATE(offerTitle, offerCompany);
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  const handleNative = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: offerTitle, text: shareText, url });
      track('native');
      setOpen(false);
    } catch {
      // utilisateur a annulé — silencieux
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track('copy');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const handleChannel = (channel: Channel) => {
    track(channel);
    setOpen(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => {
          if (canNativeShare) {
            void handleNative();
          } else {
            setOpen((v) => !v);
          }
        }}
        aria-label="Partager cette offre"
        aria-expanded={open}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-body-sm font-semibold text-neutral-700 hover:border-primary-200 hover:bg-primary-50 active:scale-95 transition-all min-h-[40px]"
      >
        <Share2 className="w-4 h-4" aria-hidden="true" />
        Partager
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Canaux de partage"
          className="absolute right-0 bottom-full mb-2 w-64 rounded-2xl bg-white shadow-xl ring-1 ring-neutral-100 p-2 z-50"
        >
          <div className="flex items-center justify-between px-2 pb-2 border-b border-neutral-100">
            <p className="text-caption font-semibold text-neutral-700">Partager</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <ul className="py-1.5 space-y-0.5">
            <MenuItem
              icon={<WhatsappIcon />}
              label="WhatsApp"
              href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
              onClick={() => handleChannel('whatsapp')}
              colorClass="text-[#1ea854] hover:bg-[#25D366]/10"
            />
            <MenuItem
              icon={<Linkedin className="w-4 h-4" aria-hidden="true" />}
              label="LinkedIn"
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
              onClick={() => handleChannel('linkedin')}
              colorClass="text-[#0a66c2] hover:bg-[#0a66c2]/10"
            />
            <MenuItem
              icon={<Twitter className="w-4 h-4" aria-hidden="true" />}
              label="Twitter"
              href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
              onClick={() => handleChannel('twitter')}
              colorClass="text-neutral-900 hover:bg-neutral-100"
            />
            <MenuItem
              icon={<Mail className="w-4 h-4" aria-hidden="true" />}
              label="Email"
              href={`mailto:?subject=${encodeURIComponent(offerTitle)}&body=${encodedText}%20${encodedUrl}`}
              onClick={() => handleChannel('email')}
              colorClass="text-primary-500 hover:bg-primary-50"
            />
            <li>
              <button
                type="button"
                onClick={handleCopy}
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-body-sm font-semibold text-info-500 hover:bg-info-50 transition-colors text-left"
              >
                {copied ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
                {copied ? 'Lien copié' : 'Copier le lien'}
              </button>
            </li>
            {canNativeShare ? (
              <li>
                <button
                  type="button"
                  onClick={handleNative}
                  role="menuitem"
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-body-sm font-semibold text-accent-500 hover:bg-accent-50 transition-colors text-left"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  Autres apps…
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  href,
  onClick,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  onClick: () => void;
  colorClass: string;
}) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        role="menuitem"
        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-body-sm font-semibold transition-colors ${colorClass}`}
      >
        {icon}
        {label}
      </a>
    </li>
  );
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.4 0 .04 5.36.03 11.96c0 2.11.55 4.17 1.6 5.98L0 24l6.22-1.63a12 12 0 0 0 5.78 1.48h.01c6.6 0 11.96-5.37 11.96-11.97 0-3.2-1.24-6.2-3.45-8.4ZM12 21.81h-.01c-1.78 0-3.52-.48-5.03-1.38l-.36-.21-3.7.97.99-3.6-.23-.37A9.94 9.94 0 0 1 2.03 12C2.04 6.49 6.51 2.03 12 2.03c2.66 0 5.16 1.04 7.04 2.92a9.92 9.92 0 0 1 2.92 7.05c0 5.51-4.47 9.81-9.96 9.81Zm5.46-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.27-.47-2.41-1.49-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.61-.91-2.21-.24-.58-.49-.5-.66-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.21 5.08 4.5.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.34Z" />
    </svg>
  );
}
