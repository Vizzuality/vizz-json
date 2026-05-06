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
})

export type AiGenerateInput = z.infer<typeof aiGenerateInputSchema>
