export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Mot de passe oublié</h2>
        <p className="text-sm text-neutral-600">
          Le flow self-service "mot de passe oublié" arrive bientôt. En attendant, contacte l'équipe
          à{' '}
          <a
            className="font-medium text-primary-500 hover:underline"
            href="mailto:support@swipejob.fr"
          >
            support@swipejob.fr
          </a>{' '}
          en précisant l'email de ton compte.
        </p>
      </div>
      <div className="text-center text-sm">
        <a className="font-medium text-primary-500 hover:underline" href="/connexion">
          ← Retour à la connexion
        </a>
      </div>
    </div>
  );
}
