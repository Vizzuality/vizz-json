import { createFileRoute } from '@tanstack/react-router'
import { chat, convertMessagesToModelMessages } from '@tanstack/ai'
import type { UIMessage } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { aiGenerateInputSchema } from '#/lib/ai/input-schema'
import { buildSystemPrompts } from '#/lib/ai/system-prompt'
import { aiResponseSchema } from '#/lib/ai/output-schema'

function stripCodeFences(text: string): string {
  const trimmed = text.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i
  const match = trimmed.match(fence)
  return match ? match[1].trim() : trimmed
}

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

        const modelMessages = convertMessagesToModelMessages(
          messages as Array<UIMessage>,
        )

        const text = (await chat({
          adapter: openaiText('gpt-5.2'),
          messages: modelMessages as never,
          systemPrompts: [...systemPrompts],
          stream: false,
          maxTokens: 4000,
        })) as string

        let parsedJson: unknown
        try {
          parsedJson = JSON.parse(stripCodeFences(text))
        } catch (err) {
          return Response.json(
            {
              error: 'Model returned invalid JSON',
              detail: err instanceof Error ? err.message : String(err),
              raw: text,
            },
            { status: 502 },
          )
        }

        const validation = aiResponseSchema.safeParse(parsedJson)
        if (!validation.success) {
          return Response.json(
            {
              error: 'Model output failed schema validation',
              issues: validation.error.issues,
              raw: parsedJson,
            },
            { status: 502 },
          )
        }

        return Response.json(validation.data)
      },
    },
  },
})
