// Zod schemas for every request input. Values that must exist in the data (recruiter,
// position, client) are checked against /api/meta in services/reports.js.
import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use YYYY-MM-DD')
const optionalText = z.string().trim().max(80).optional().default('')

export const filtersSchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  recruiter: z.string().regex(/^[A-Za-z0-9_-]{0,32}$/, 'invalid recruiter id').optional().default(''),
  position: optionalText,
  client: optionalText,
}).refine(f => !f.from || !f.to || f.from <= f.to, { message: 'from must be on or before to', path: ['from'] })

export const applicationsSchema = filtersSchema.and(z.object({
  q: z.string().trim().max(60).optional().default(''),
  page: z.coerce.number().int().min(1).max(100000).optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(100).optional().default(25),
}))

export const applicationIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,32}$/, 'invalid application id')
