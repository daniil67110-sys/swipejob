import { Footer } from '@/components/shared/Footer';

/**
 * SwipeJob — Landing page placeholder (marketing)
 * Sera développée en Story 7.1 — Landing publique optimisée SEO
 */
export default function MarketingHomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-info-500 via-primary-500 to-success-500 text-white font-display font-bold text-4xl shadow-xl mb-8">
            S
          </div>
          <h1 className="text-display-xl font-display font-bold text-neutral-900 mb-4">
            Swipe
            <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
              Job
            </span>
          </h1>
          <p className="text-body-lg text-neutral-600 mb-2">
            Trouve ton job en swipant — bientôt disponible
          </p>
          <p className="text-caption text-neutral-400">Beta privée en cours</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
