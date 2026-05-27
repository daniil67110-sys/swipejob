import { createHash } from 'node:crypto';

/**
 * Story 3.5 + 3.7 — Génération lettre de motivation Mistral.
 *
 * Partagé entre apps/worker (génération initiale post-swipe) et apps/web
 * (régénération synchrone depuis le drawer review Story 3.7).
 *
 * La fonction ne lit pas process.env directement : on lui passe la config
 * pour qu'elle soit testable et utilisable dans n'importe quel contexte runtime.
 */

const SYSTEM_PROMPT = `Tu es un assistant qui rédige des lettres de motivation pour des étudiants français qui postulent à des stages/alternances.

Règles strictes :
- **Langue : exclusivement français (Loi Toubon — Story 6.7). Aucune phrase, aucun mot en anglais sauf nom propre, marque ou acronyme technique notoire.**
- Ton bienveillant, professionnel, sans formules pompeuses
- 200-400 mots maximum
- Encodage UTF-8 typographique FR (apostrophes courbes ', guillemets « », espaces insécables)
- Pas de balises HTML
- Pas d'invention d'expérience non mentionnée dans le profil
- Structure : accroche personnalisée à l'offre, 2 paragraphes profil/motivation, conclusion
- Adresse à l'entreprise avec le ton "vous"
- Signature : prénom + nom de l'étudiant

Retourne UNIQUEMENT le texte de la lettre, pas de markdown, pas de balises, pas de commentaires.`;

const FALLBACK_TEMPLATE = (studentName: string, jobTitle: string, companyName: string) => `Bonjour,

Je vous adresse ma candidature pour le poste de ${jobTitle} au sein de ${companyName}.

Étudiant motivé, je suis particulièrement intéressé par les missions proposées et l'opportunité de mettre mes compétences au service de votre équipe. Mon parcours et mes expériences m'ont permis de développer des qualités qui correspondent à ce que vous recherchez.

Je serais ravi de pouvoir échanger plus longuement avec vous sur ma candidature lors d'un entretien à votre convenance.

Cordialement,
${studentName}`;

export type CoverLetterInput = {
  studentName: string;
  studentSkills: string[];
  studentHeadline: string | null;
  studentSummary: string | null;
  jobTitle: string;
  companyName: string;
  jobDescription: string | null;
  jobCity: string | null;
};

export type CoverLetterConfig = {
  /** Clé API Mistral. Null/undef → fallback template direct. */
  mistralApiKey: string | null | undefined;
  /** Modèle Mistral (ex: 'mistral-large-latest'). */
  mistralModel: string;
  /** Logger optionnel — si fourni, warns y sont publiés. */
  logger?: { warn: (data: unknown, msg?: string) => void };
};

export type CoverLetterResult = {
  ok: true;
  text: string;
  status: 'generated' | 'template_fallback';
  meta: {
    model: string;
    provider: 'mistral' | 'fallback';
    promptHash: string;
    latencyMs: number;
    tokensInput: number | null;
    tokensOutput: number | null;
    success: boolean;
  };
};

export async function generateCoverLetter(
  input: CoverLetterInput,
  config: CoverLetterConfig,
): Promise<CoverLetterResult> {
  const userPrompt = buildPrompt(input);
  const promptHash = createHash('sha256').update(userPrompt).digest('hex');

  if (!config.mistralApiKey) {
    config.logger?.warn({}, 'Mistral not configured — cover letter fallback template');
    return {
      ok: true,
      text: FALLBACK_TEMPLATE(input.studentName, input.jobTitle, input.companyName),
      status: 'template_fallback',
      meta: {
        model: 'fallback',
        provider: 'fallback',
        promptHash,
        latencyMs: 0,
        tokensInput: null,
        tokensOutput: null,
        success: true,
      },
    };
  }

  const start = Date.now();
  try {
    const { Mistral } = await import('@mistralai/mistralai');
    const client = new Mistral({ apiKey: config.mistralApiKey });
    const res = await client.chat.complete({
      model: config.mistralModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });
    const latencyMs = Date.now() - start;
    const choice = res.choices?.[0];
    const content = choice?.message?.content;
    const text = typeof content === 'string' ? content.trim() : '';
    if (!text || text.length < 50) {
      throw new Error('Mistral returned empty/short letter');
    }
    return {
      ok: true,
      text: sanitizeLetter(text),
      status: 'generated',
      meta: {
        model: config.mistralModel,
        provider: 'mistral',
        promptHash,
        latencyMs,
        tokensInput: res.usage?.promptTokens ?? null,
        tokensOutput: res.usage?.completionTokens ?? null,
        success: true,
      },
    };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    const latencyMs = Date.now() - start;
    config.logger?.warn({ errMessage }, 'Mistral cover letter failed, fallback template');
    return {
      ok: true,
      text: FALLBACK_TEMPLATE(input.studentName, input.jobTitle, input.companyName),
      status: 'template_fallback',
      meta: {
        model: config.mistralModel,
        provider: 'mistral',
        promptHash,
        latencyMs,
        tokensInput: null,
        tokensOutput: null,
        success: false,
      },
    };
  }
}

function buildPrompt(input: CoverLetterInput): string {
  return `## Profil étudiant
Nom : ${input.studentName}
Titre : ${input.studentHeadline ?? 'Étudiant'}
Résumé : ${input.studentSummary ?? '(non précisé)'}
Compétences : ${input.studentSkills.join(', ') || '(non précisées)'}

## Offre
Poste : ${input.jobTitle}
Entreprise : ${input.companyName}
Localisation : ${input.jobCity ?? '(non précisée)'}
Description :
${(input.jobDescription ?? '').slice(0, 3000)}

## Mission
Rédige la lettre de motivation pour cet étudiant qui postule à cette offre. Personnalisée, bienveillante, 200-400 mots.`;
}

export function sanitizeLetter(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/^```[a-z]*\n?/, '')
    .replace(/```$/, '')
    .replace(/'/g, '’')
    .trim();
}
