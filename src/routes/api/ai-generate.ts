import { createFileRoute } from '@tanstack/react-router'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { aiGenerateInputSchema } from '#/lib/ai/input-schema'
import { buildSystemPrompts } from '#/lib/ai/system-prompt'
import { aiOutputSchema } from '#/lib/ai/output-schema'

export const Route = createFileRoute('/api/ai-generate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const { messages, renderer, mapboxStyleUrl } =
          aiGenerateInputSchema.parse(body)

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
      },
    },
  },
})
