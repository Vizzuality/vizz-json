import { createFileRoute } from '@tanstack/react-router'
import {
  chat,
  convertMessagesToModelMessages,
  maxIterations,
} from '@tanstack/ai'
import type { UIMessage } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { aiGenerateInputSchema } from '#/lib/ai/input-schema'
import { buildSystemPrompts } from '#/lib/ai/system-prompt'
import { aiResponseSchema } from '#/lib/ai/output-schema'
import type { AiOutput } from '#/lib/ai/output-schema'
import { createFetchTileJsonTool } from '#/lib/ai/tools/fetch-tilejson'
import { postProcess } from '#/lib/ai/post-process'
import { validateStyle } from '#/lib/ai/style-validator'
import { resolveParams } from '#/lib/converter/params-resolver'
import type { RendererId } from '#/lib/ai/types'

const MAX_VALIDATION_RETRIES = 2

function stripCodeFences(text: string): string {
  const trimmed = text.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i
  const match = trimmed.match(fence)
  return match ? match[1].trim() : trimmed
}

function validateEnvelopeStyle(
  envelope: AiOutput,
  renderer: RendererId,
): readonly string[] {
  const processed = postProcess(envelope)
  const defaults = Object.fromEntries(
    processed.params_config.map((p) => [p.key, p.default]),
  )
  const resolved = resolveParams(processed.config, defaults)
  return validateStyle(resolved, renderer).map((e) => e.message)
}

export const Route = createFileRoute('/api/ai-generate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const { messages, renderer, mapboxToken, mapboxStyleUrl } =
          aiGenerateInputSchema.parse(body)

        const systemPrompts = buildSystemPrompts({
          renderer,
          mapboxStyleUrl,
          // mapboxToken intentionally omitted from system prompts
        })

        const fetchTileJsonTool = createFetchTileJsonTool({ mapboxToken })
        const conversation: UIMessage[] = [...messages] as UIMessage[]
        let lastFailure: { raw: unknown; issues: unknown } | null = null

        for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
          const modelMessages = convertMessagesToModelMessages(conversation)

          const text = (await chat({
            adapter: openaiText('gpt-5.2'),
            messages: modelMessages as never,
            systemPrompts: [...systemPrompts],
            tools: [fetchTileJsonTool],
            agentLoopStrategy: maxIterations(3),
            stream: false,
            maxTokens: 4000,
          })) as string

          let parsedJson: unknown
          try {
            parsedJson = JSON.parse(stripCodeFences(text))
          } catch (err) {
            lastFailure = {
              raw: text,
              issues: [
                {
                  message: `Output was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
                },
              ],
            }
            conversation.push(
              {
                id: `retry-assistant-${attempt}`,
                role: 'assistant',
                parts: [{ type: 'text', content: text }],
              } as unknown as UIMessage,
              {
                id: `retry-user-${attempt}`,
                role: 'user',
                parts: [
                  {
                    type: 'text',
                    content:
                      'Your previous response was not valid JSON. Return a single JSON object matching the agreed envelope schema. No prose, no markdown fences.',
                  },
                ],
              } as unknown as UIMessage,
            )
            continue
          }

          const validation = aiResponseSchema.safeParse(parsedJson)
          if (!validation.success) {
            lastFailure = {
              raw: parsedJson,
              issues: validation.error.issues,
            }
            conversation.push(
              {
                id: `retry-assistant-${attempt}`,
                role: 'assistant',
                parts: [{ type: 'text', content: text }],
              } as unknown as UIMessage,
              {
                id: `retry-user-${attempt}`,
                role: 'user',
                parts: [
                  {
                    type: 'text',
                    content: `Your previous response failed schema validation: ${JSON.stringify(validation.error.issues)}. Return a corrected JSON object matching the agreed envelope schema.`,
                  },
                ],
              } as unknown as UIMessage,
            )
            continue
          }

          const envelope = validation.data.envelope
          if (envelope) {
            const styleErrors = validateEnvelopeStyle(envelope, renderer)
            if (styleErrors.length > 0) {
              lastFailure = { raw: parsedJson, issues: styleErrors }
              conversation.push(
                {
                  id: `retry-assistant-${attempt}`,
                  role: 'assistant',
                  parts: [{ type: 'text', content: text }],
                } as unknown as UIMessage,
                {
                  id: `retry-user-${attempt}`,
                  role: 'user',
                  parts: [
                    {
                      type: 'text',
                      content: `Your previous map style failed ${renderer === 'mapbox' ? 'Mapbox' : 'MapLibre'} style spec validation with these errors: ${styleErrors.join(' | ')}. Return a corrected JSON object that satisfies the spec. Common gotchas: "interpolate" expressions require literal numbers (not parameter refs) at input-stop positions; check property names against the spec; ensure layer types match source types.`,
                    },
                  ],
                } as unknown as UIMessage,
              )
              continue
            }
          }

          return Response.json(validation.data)
        }

        return Response.json(
          {
            error: 'Model could not produce a valid response after retries',
            issues: lastFailure?.issues ?? [],
            raw: lastFailure?.raw ?? null,
          },
          { status: 502 },
        )
      },
    },
  },
})
