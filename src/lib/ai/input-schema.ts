import { z } from 'zod'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

export const aiGenerateInputSchema = z.object({
  messages: z.array(messageSchema).min(1),
  renderer: z.enum(['maplibre', 'mapbox']),
  mapboxToken: z.string().optional(),
  mapboxStyleUrl: z.string().optional(),
})

export type AiGenerateInput = z.infer<typeof aiGenerateInputSchema>
