import { z } from 'zod';

export const experienceSchema = z.object({
  company: z.string().nullable(),
  title: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  description: z.string().nullable(),
});

export const educationSchema = z.object({
  school: z.string().nullable(),
  degree: z.string().nullable(),
  field: z.string().nullable(),
  startYear: z.number().int().min(1900).max(2100).nullable(),
  endYear: z.number().int().min(1900).max(2100).nullable(),
});

export const parsedCvSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  headline: z.string().nullable(),
  summary: z.string().nullable(),
  phoneE164: z.string().nullable(),
  currentLocation: z.string().nullable(),
  linkedinUrl: z
    .union([z.string().url(), z.literal(''), z.null()])
    .transform((v) => (v ? v : null)),
  experiences: z.array(experienceSchema).default([]),
  educations: z.array(educationSchema).default([]),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});

export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type ParsedCv = z.infer<typeof parsedCvSchema>;
