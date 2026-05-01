import { z } from 'zod'

const tierSchema = z.enum(['basic', 'intermediate', 'advanced'])

const metadataSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  tier: tierSchema,
})

const legendItemSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
})

const legendConfigSchema = z.object({
  type: z.enum(['basic', 'choropleth', 'gradient']),
  items: z.array(legendItemSchema),
})

const parameterizeEntrySchema = z.object({
  path: z.string().min(1),
  key: z.string().min(1),
  default: z.unknown(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  options: z.array(z.string()).optional(),
  group: z.literal('legend').optional(),
})

const styleSchema = z.record(z.string(), z.unknown())

export const aiOutputSchema = z.object({
  metadata: metadataSchema,
  style: styleSchema,
  parameterize: z.array(parameterizeEntrySchema),
  legend_config: legendConfigSchema.optional(),
})

export const aiResponseSchema = z.object({
  reply: z.string().min(1),
  envelope: aiOutputSchema,
})

export type AiOutput = z.infer<typeof aiOutputSchema>
export type AiResponse = z.infer<typeof aiResponseSchema>
export type ParameterizeEntry = z.infer<typeof parameterizeEntrySchema>
