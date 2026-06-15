import { z } from 'zod';

const curriculumWeek = z.object({
  week: z.number().int().min(1),
  title: z.string().min(1).max(200),
  skills: z.array(z.string()).optional(),
  hours: z.number().min(0).optional(),
});

const programReference = z.object({
  name: z.string().min(1).max(160),
  role: z.string().max(160).optional(),
  contact: z.string().max(200).optional(),
});

export const createProgramSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(8000).optional(),
  language: z.enum(['ca', 'es', 'en']).optional(),
  curriculum: z.array(curriculumWeek).max(52).optional(),
  timeFrameSessions: z.number().int().min(1).max(200).optional(),
  timeFrameTotalHours: z.number().min(0).max(2000).optional(),
  assessmentMethod: z.string().max(2000).optional(),
  accreditationBody: z.string().max(200).optional(),
  accreditationId: z.string().max(200).optional(),
  references: z.array(programReference).max(10).optional(),
});

export const updateProgramSchema = createProgramSchema.partial();

export const credentialKindSchema = z.enum([
  'diploma',
  'license',
  'accreditation',
  'reference_letter',
]);
