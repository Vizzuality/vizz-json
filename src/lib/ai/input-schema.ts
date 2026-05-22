import { z } from 'zod'

const textPartSchema = z.object({
  type: z.literal('text'),
  content: z.string(),
})

const messagePartSchema = z.union([
  textPartSchema,
  z.object({ type: z.string() }).passthrough(),
])

const uiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['system', 'user', 'assistant']),
  parts: z.array(messagePartSchema),
})

export const aiGenerateInputSchema = z.object({
  messages: z.array(uiMessageSchema).min(1),
  renderer: z.enum(['maplibre', 'mapbox']),
  mapboxToken: z.string().optional(),
  mapboxStyleUrl: z.string().optional(),
  paramValues: z.record(z.string(), z.unknown()).optional(),
  currentSnapshot: z
    .object({
      metadata: z.object({}).passthrough(),
      config: z.record(z.string(), z.unknown()),
      params_config: z.array(z.record(z.string(), z.unknown())),
    })
    .passthrough()
    .optional(),
})

export type AiGenerateInput = z.infer<typeof aiGenerateInputSchema>
