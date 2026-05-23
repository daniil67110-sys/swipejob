/**
 * SwipeJob — Tailwind CSS v4 base preset
 * Design tokens: couleurs, typographie, espacement, rayons, ombres
 * Source de vérité: ux-design-specification.md lignes 659-829
 *
 * IMPORTANT: NE PAS modifier les valeurs sans synchroniser avec ux-design-specification.md
 */

/** @type {import('tailwindcss').Config} */
const basePreset = {
  theme: {
    extend: {
      // ============================================================
      // COULEURS — Source: UX spec lignes 672-715
      // ============================================================
      colors: {
        // Primary — Indigo (marque principale)
        primary: {
          50: '#EEF1FF', // Background subtil, hover léger
          100: '#DCE3FF', // Background sélection, focus rings
          500: '#4F5BFF', // Indigo signature SwipeJob — boutons primaires, scores
          600: '#3D48E5', // Hover sur primary, états actifs
          900: '#1A1E5C', // Headings dark mode, logo
        },

        // Accent — Coral (CTA secondaires, swipe droit)
        accent: {
          100: '#FFE5DC', // Background coral subtil
          500: '#FF7B5A', // Coral signature — swipe droite, célébrations
        },

        // Neutral — Gris système — Source: UX spec lignes 684-695
        neutral: {
          0: '#FFFFFF', // Blanc pur — background light mode
          50: '#FAFAFB', // Off-white — background subtil
          100: '#F2F2F4', // Gris très clair — borders légers, surfaces secondaires
          200: '#E5E5EA', // Gris clair — borders standard
          400: '#9999A5', // Gris medium — text disabled, placeholders
          600: '#5C5C70', // Gris foncé — body text secondaire
          900: '#1A1A22', // Quasi noir — body text primaire light mode
          950: '#0D0D14', // Noir profond — background dark mode
        },

        // Couleurs sémantiques — Source: UX spec lignes 697-706
        success: {
          100: '#D4F4E4', // Background success subtil
          500: '#1FB87A', // Vert frais — match score élevé, succès, signatures
        },
        error: {
          100: '#FFE2E5', // Background error subtil
          500: '#FF4757', // Rouge cohérent — swipe gauche overlay, erreurs critiques
        },
        warning: {
          100: '#FFE9D6', // Background warning subtil
          500: '#FFA940', // Ambre doux — avertissements, pénurie d'offres
        },
        info: {
          100: '#DBEEFF', // Background info subtil
          500: '#3998FF', // Bleu informatif — swipe haut (sauver), tips
        },
      },

      // ============================================================
      // TYPOGRAPHIE — Source: UX spec lignes 746-759
      // ============================================================
      fontFamily: {
        // UI / body — Google Fonts (Inter)
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Display — Cabinet Grotesk (fallback: Sora)
        // Décision: utiliser Sora (Google Fonts, licence SIL OFL libre)
        // Cabinet Grotesk nécessite une licence commerciale
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        // Monospace — codes, IDs techniques
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },

      fontSize: {
        // Display scale — famille: Cabinet (Sora fallback)
        // UX spec: display-2xl = 48px/3rem, lh=1.1, w=700
        'display-2xl': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        // UX spec: display-xl = 40px/2.5rem, lh=1.1, w=700
        'display-xl': ['2.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        // UX spec: display-lg = 32px/2rem, lh=1.15, w=600
        'display-lg': ['2rem', { lineHeight: '1.15', fontWeight: '600' }],
        // UX spec: display-md = 24px/1.5rem, lh=1.2, w=600
        'display-md': ['1.5rem', { lineHeight: '1.2', fontWeight: '600' }],

        // Heading scale — famille: Inter
        // UX spec: heading-lg = 20px/1.25rem, lh=1.3, w=600
        'heading-lg': ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        // UX spec: heading-md = 18px/1.125rem, lh=1.35, w=600
        'heading-md': ['1.125rem', { lineHeight: '1.35', fontWeight: '600' }],
        // UX spec: heading-sm = 16px/1rem, lh=1.4, w=600
        'heading-sm': ['1rem', { lineHeight: '1.4', fontWeight: '600' }],

        // Body scale — famille: Inter
        // UX spec: body-lg = 17px/1.0625rem, lh=1.5, w=400
        'body-lg': ['1.0625rem', { lineHeight: '1.5', fontWeight: '400' }],
        // UX spec: body-md = 15px/0.9375rem, lh=1.5, w=400
        'body-md': ['0.9375rem', { lineHeight: '1.5', fontWeight: '400' }],
        // UX spec: body-sm = 13px/0.8125rem, lh=1.5, w=400
        'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],

        // Caption — famille: Inter
        // UX spec: caption = 12px/0.75rem, lh=1.4, w=500
        caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
        // Mono — famille: JetBrains Mono
        // UX spec: mono = 14px, lh=1.5, w=400
        mono: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
      },

      // ============================================================
      // ESPACEMENT — Grille 8pt — Source: UX spec lignes 785-794
      // ============================================================
      spacing: {
        1: '4px', // space-1: espacement micro (icônes/text inline)
        2: '8px', // space-2: espacement compact (boutons internes)
        3: '12px', // space-3: espacement normal (gap entre éléments proches)
        4: '16px', // space-4: espacement standard (padding card, gap form)
        5: '20px',
        6: '24px', // space-6: espacement aéré (gap entre sections d'écran)
        7: '28px',
        8: '32px', // space-8: espacement large (gap entre groupes de contenu)
        9: '36px',
        10: '40px',
        12: '48px', // space-12: espacement très large (séparation forte)
        14: '56px',
        16: '64px', // space-16: espacement maximal (hero, section landing)
        20: '80px',
        24: '96px',
        32: '128px',
        40: '160px',
        48: '192px',
        64: '256px',
      },

      // ============================================================
      // RAYONS — Source: UX spec lignes 799-804
      // ============================================================
      borderRadius: {
        sm: '6px', // Inputs, badges, petits boutons
        md: '10px', // Boutons standard, toasts
        lg: '14px', // Cards d'offres (SwipeCard), modales
        xl: '20px', // Bottom sheets, hero elements
        '2xl': '28px',
        full: '9999px', // Avatars, pills, indicateurs ronds
      },

      // ============================================================
      // OMBRES — Source: UX spec lignes 808-813
      // ============================================================
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)', // Inputs au focus, boutons élevés
        md: '0 4px 12px rgba(0,0,0,0.08)', // Cards de surface
        lg: '0 12px 24px rgba(0,0,0,0.12)', // SwipeCard (signature !)
        xl: '0 24px 48px rgba(0,0,0,0.16)', // Modales, dialogs, bottom sheets
      },
    },
  },
};

export default basePreset;
