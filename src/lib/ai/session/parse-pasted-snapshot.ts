import { z } from 'zod'
import type { AiSchema } from '#/lib/ai/persistence/types'

const tierSchema = z.enum(['basic', 'intermediate', 'advanced'])

const metadataSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  tier: tierSchema,
  preview: z.literal('components').optional(),
})

const legendItemSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
})

const legendConfigSchema = z.object({
  type: z.enum(['basic', 'choropleth', 'gradient']),
  items: z.array(legendItemSchema),
})

const paramConfigSchema = z.object({
  key: z.string().min(1),
  default: z.unknown(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  options: z.array(z.string()).optional(),
  group: z.literal('legend').optional(),
})

const snapshotSchema = z.object({
  metadata: metadataSchema,
  config: z.record(z.string(), z.unknown()),
  params_config: z.array(paramConfigSchema),
  legend_config: legendConfigSchema.optional(),
})

export function parsePastedSnapshot(text: string): AiSchema | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('{')) return null
  let raw: unknown
  try {
    raw = JSON.parse(trimmed)
  } catch {
    return null
  }
  const result = snapshotSchema.safeParse(raw)
  if (!result.success) return null
  return result.data as AiSchema
}
