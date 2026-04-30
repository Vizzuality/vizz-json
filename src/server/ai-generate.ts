import { createServerFn } from '@tanstack/react-start'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { z } from 'zod'
import { aiOutputSchema } from '#/lib/ai/output-schema'
import { buildSystemPrompts } from '#/lib/ai/system-prompt'

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

export const aiGenerateFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => aiGenerateInputSchema.parse(data))
  .handler(({ data }) => {
    const { messages, renderer, mapboxStyleUrl } = data
    const systemPrompts = buildSystemPrompts({
      renderer,
      mapboxStyleUrl,
      // mapboxToken intentionally omitted from system prompts
    })

    const stream = chat({
      adapter: openaiText('gpt-5.2'),
      messages,
      systemPrompts: [...systemPrompts],
      outputSchema: aiOutputSchema,
      maxTokens: 4000,
    })

    return toServerSentEventsResponse(stream)
  })
