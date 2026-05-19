import { createHash } from 'node:crypto';
import { env, isMistralConfigured } from './env.js';
import logger from './logger.js';

const SYSTEM_PROMPT = `Tu es un coach carrière qui prépare des étudiants français à un entretien d'embauche pour un stage ou une alternance.

Règles strictes :
- Tu réponds en JSON valide uniquement, sans markdown, sans commentaires.
- Le JSON contient 3 clés : "companySummary" (string, 3 lignes max, ton bienveillant), "probableQuestions" (array de 3 questions FR probables fondées sur la description), "matchingStrengths" (array de 3 à 5 points forts du candidat à mettre en avant).
- Pas d'invention de faits non présents.
- Encodage UTF-8 typographique FR.`;

export type InterviewPrepInput = {
  studentName: string;
  studentSkills: string[];
  studentHeadline: string | null;
  studentSummary: string | null;
  jobTitle: string;
  companyName: string;
  jobDescription: string | null;
  jobCity: string | null;
  matchFeatures: string[]; // ['cosine_skills', 'pref_contract_type', ...]
};

export type InterviewPrepResult = {
  ok: true;
  companySummary: string;
  probableQuestions: string[];
  matchingStrengths: string[];
  meta: {
    model: string;
    provider: 'mistral' | 'fallback';
    promptHash: string;
    latencyMs: number;
    success: boolean;
  };
};

const FALLBACK_QUESTIONS = (jobTitle: string, companyName: string) => [
  `Pourquoi avoir choisi de postuler à ${companyName} pour le poste de ${jobTitle} ?`,
  `Peux-tu nous présenter une expérience pertinente en lien avec ce poste ?`,
  `Comment imagines-tu tes 6 premiers mois si tu rejoins l’équipe ?`,
];

/**
 * Story 4.7 — Génère le contenu InterviewPrep via Mistral (JSON mode).
 * Fallback : template générique si Mistral indispo.
 */
export async function generateInterviewPrep(
  input: InterviewPrepInput,
): Promise<InterviewPrepResult> {
  const userPrompt = buildPrompt(input);
  const promptHash = createHash('sha256').update(userPrompt).digest('hex');

  if (!isMistralConfigured || !env.MISTRAL_API_KEY) {
    logger.warn('Mistral not configured — interview prep fallback template');
    return fallback(input, promptHash, 'fallback');
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
      responseFormat: { type: 'json_object' },
    });
    const latencyMs = Date.now() - start;
    const choice = res.choices?.[0];
    const content = choice?.message?.content;
    const raw = typeof content === 'string' ? content.trim() : '';
    if (!raw) throw new Error('Mistral returned empty content');

    const parsed = JSON.parse(raw) as Partial<{
      companySummary: string;
      probableQuestions: string[];
      matchingStrengths: string[];
    }>;
    const companySummary =
      typeof parsed.companySummary === 'string' && parsed.companySummary.length > 0
        ? parsed.companySummary.slice(0, 600)
        : `${input.companyName} recrute un·e ${input.jobTitle}. Prépare un bref pitch sur ta motivation.`;
    const probableQuestions = Array.isArray(parsed.probableQuestions)
      ? parsed.probableQuestions
          .filter((q): q is string => typeof q === 'string')
          .slice(0, 5)
          .map((q) => q.slice(0, 300))
      : [];
    const matchingStrengths = Array.isArray(parsed.matchingStrengths)
      ? parsed.matchingStrengths
          .filter((s): s is string => typeof s === 'string')
          .slice(0, 6)
          .map((s) => s.slice(0, 200))
      : [];
    if (probableQuestions.length < 1 || matchingStrengths.length < 1) {
      throw new Error('Mistral returned incomplete prep');
    }
    return {
      ok: true,
      companySummary,
      probableQuestions,
      matchingStrengths,
      meta: {
        model: env.MISTRAL_MODEL,
        provider: 'mistral',
        promptHash,
        latencyMs,
        success: true,
      },
    };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.warn({ errMessage }, 'Mistral interview prep failed, fallback');
    return fallback(input, promptHash, 'mistral', Date.now() - start);
  }
}

function fallback(
  input: InterviewPrepInput,
  promptHash: string,
  provider: 'mistral' | 'fallback',
  latencyMs = 0,
): InterviewPrepResult {
  const strengths = input.studentSkills.slice(0, 5).map((s) => `Tu maîtrises : ${s}`);
  return {
    ok: true,
    companySummary: `${input.companyName} recrute un·e ${input.jobTitle}${
      input.jobCity ? ` à ${input.jobCity}` : ''
    }. Prépare un pitch court sur tes motivations.`,
    probableQuestions: FALLBACK_QUESTIONS(input.jobTitle, input.companyName),
    matchingStrengths:
      strengths.length > 0 ? strengths : ['Profil étudiant motivé', 'Disponibilité', 'Curiosité'],
    meta: {
      model: provider === 'fallback' ? 'fallback' : env.MISTRAL_MODEL,
      provider,
      promptHash,
      latencyMs,
      success: provider === 'fallback',
    },
  };
}

function buildPrompt(input: InterviewPrepInput): string {
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

## Critères de matching mis en avant pour le score
${input.matchFeatures.join(', ') || '(aucun)'}

## Mission
Génère le JSON avec companySummary, probableQuestions et matchingStrengths pour cet entretien dans 24h.`;
}
