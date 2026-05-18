import { createHash } from 'node:crypto';
import { env, isMistralConfigured } from './env.js';
import logger from './logger.js';

const SYSTEM_PROMPT = `Tu es un assistant qui rédige des lettres de motivation pour des étudiants français qui postulent à des stages/alternances.

Règles strictes :
- Ton bienveillant, professionnel, sans formules pompeuses
- 200-400 mots maximum
- Encodage UTF-8 typographique FR (apostrophes, espaces insécables)
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
  studentName: string; // "Prénom Nom" déjà formaté côté caller
  studentSkills: string[];
  studentHeadline: string | null;
  studentSummary: string | null;
  jobTitle: string;
  companyName: string;
  jobDescription: string | null;
  jobCity: string | null;
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

/**
 * Story 3.5 — génère une lettre de motivation Mistral.
 * Fallback template si Mistral indispo (sans throw, V1 simple).
 */
export async function generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterResult> {
  const userPrompt = buildPrompt(input);
  const promptHash = createHash('sha256').update(userPrompt).digest('hex');

  if (!isMistralConfigured || !env.MISTRAL_API_KEY) {
    logger.warn('Mistral not configured — cover letter fallback template');
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
    const client = new Mistral({ apiKey: env.MISTRAL_API_KEY });
    const res = await client.chat.complete({
      model: env.MISTRAL_MODEL,
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
        model: env.MISTRAL_MODEL,
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
    logger.warn({ errMessage }, 'Mistral cover letter failed, fallback template');
    return {
      ok: true,
      text: FALLBACK_TEMPLATE(input.studentName, input.jobTitle, input.companyName),
      status: 'template_fallback',
      meta: {
        model: env.MISTRAL_MODEL,
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

/**
 * Sanitize la sortie LLM :
 *  - retire les éventuelles balises HTML (NFR-L3)
 *  - trim final
 *  - normalize apostrophes/quotes typo FR (best-effort)
 */
function sanitizeLetter(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/^```[a-z]*\n?/, '') // strip code fences accidentels
    .replace(/```$/, '')
    .replace(/'/g, '’') // apostrophe typo
    .trim();
}
