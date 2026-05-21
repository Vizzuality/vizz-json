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
import {
  validateLegendColors,
  validateParameterizeTargets,
  validateStyle,
} from '#/lib/ai/style-validator'
import { resolveParams } from '#/lib/converter/params-resolver'
import type { RendererId } from '#/lib/ai/types'
// Row 2 validator — imported against the contract; the module will exist once
// feat/color-binding-validator Row 2 lands. TypeScript will error until then,
// which is expected and documented in the branch strategy.
import { getFunctionMeta } from '#/lib/converter'
import { validateAndRetry } from '#/lib/ai/validate-and-retry'

// Total schema-validation attempts (initial + retries) for JSON/envelope-schema/
// style failures inside the main loop below. Distinct from the color-binding
// retry, which is handled separately by `validateAndRetry()` (1 retry budget).
const MAX_SCHEMA_ATTEMPTS = 3

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
  const matchTargetErrors = validateParameterizeTargets(envelope).map(
    (e) => e.message,
  )
  if (matchTargetErrors.length > 0) return matchTargetErrors
  let processed: ReturnType<typeof postProcess>
  try {
    processed = postProcess(envelope)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return [
      `parameterize entry has an unresolvable path: ${message}. Every "parameterize[].path" must point to a value that already exists in "style". Use bracket notation for array indices (e.g. "styles[0].paint.fill-color[4]") and never invent nested indices that the literal value at that position does not contain.`,
    ]
  }
  const defaults = Object.fromEntries(
    processed.params_config.map((p) => [p.key, p.default]),
  )
  const resolved = resolveParams(processed.config, defaults)
  const styleErrors = validateStyle(resolved, renderer).map((e) => e.message)
  const legendErrors = validateLegendColors({ style: envelope.style }).map(
    (e) => e.message,
  )
  return [...styleErrors, ...legendErrors]
}

export const Route = createFileRoute('/api/ai-generate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const {
          messages,
          renderer,
          mapboxToken,
          mapboxStyleUrl,
          paramValues,
          currentSnapshot,
        } = aiGenerateInputSchema.parse(body)

        const systemPrompts = buildSystemPrompts({
          renderer,
          mapboxStyleUrl,
          paramValues,
          currentSnapshot,
          // mapboxToken intentionally omitted from system prompts
        })

        const fetchTileJsonTool = createFetchTileJsonTool({ mapboxToken })
        const conversation: UIMessage[] = [...messages] as UIMessage[]
        let lastFailure: { raw: unknown; issues: unknown } | null = null

        let successEnvelope: AiOutput | null = null
        let successText: string | null = null
        let successValidation: ReturnType<
          typeof aiResponseSchema.safeParse
        > | null = null

        for (let attempt = 0; attempt < MAX_SCHEMA_ATTEMPTS; attempt++) {
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
              const hasLegendError = styleErrors.some((m) =>
                m.startsWith('legend_config.items'),
              )
              const hasPathError = styleErrors.some((m) =>
                m.startsWith('parameterize entry has an unresolvable path'),
              )
              const hasMatchLabelError = styleErrors.some((m) =>
                m.includes('targets a "match" label'),
              )
              const legendHint = hasLegendError
                ? ' Legend items[].value must be a "@@#params.<key>" reference with a matching parameterize entry (default = the hex colour) — never a literal colour.'
                : ''
              const pathHint = hasPathError
                ? ' For "step"/"interpolate" expressions, each stop value (threshold or colour) is a top-level element of the expression array. Index them directly — e.g. for `"fill-color": ["step", ["get", "x"], "#aaa", 10, "#bbb", 50, "#ccc"]` the parameterize paths are "styles[0].paint.fill-color[2]" (#aaa), "styles[0].paint.fill-color[3]" (10), "styles[0].paint.fill-color[4]" (#bbb), etc. Never use nested bracket indices unless the literal at that path is itself an array.'
                : ''
              const matchHint = hasMatchLabelError
                ? ' For "match" expressions `["match", input, label1, output1, label2, output2, ..., default]`, the labels (indices 2, 4, 6, ...) are the literal data values being compared and MUST stay as the original strings/numbers. Only parameterize the output slots at odd indices ≥ 3 and the trailing default. Parameterizing a label slot breaks the match: it compares feature values against colour hex strings and every feature falls through to the default colour.'
                : ''
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
                      content: `Your previous envelope failed validation with these errors: ${styleErrors.join(' | ')}. Return a corrected JSON object.${legendHint}${pathHint}${matchHint} Common gotchas: check property names against the ${renderer === 'mapbox' ? 'Mapbox' : 'MapLibre'} style spec; ensure layer types match source types.`,
                    },
                  ],
                } as unknown as UIMessage,
              )
              continue
            }
          }

          successEnvelope = envelope ?? null
          successText = text
          successValidation = validation
          break
        }

        if (successValidation === null) {
          return Response.json(
            {
              error: 'Model could not produce a valid response after retries',
              issues: lastFailure?.issues ?? [],
              raw: lastFailure?.raw ?? null,
            },
            { status: 502 },
          )
        }

        if (!successEnvelope) {
          // Model replied without an envelope — return the validated reply as-is.
          return Response.json(successValidation.data)
        }

        // ── Color-binding gate via validateAndRetry ──────────────────────
        // The helper handles its own one-shot retry internally.
        let processed: ReturnType<typeof postProcess>
        try {
          processed = postProcess(successEnvelope)
        } catch {
          // postProcess errors are already caught by the style-validation step
          // inside the loop; reaching here means the path was clean.
          return Response.json(successValidation.data)
        }

        const result = await validateAndRetry(
          processed,
          async (retryMessage) => {
            conversation.push(
              {
                id: 'cb-retry-assistant',
                role: 'assistant',
                parts: [{ type: 'text', content: successText ?? '' }],
              } as unknown as UIMessage,
              {
                id: 'cb-retry-user',
                role: 'user',
                parts: [{ type: 'text', content: retryMessage }],
              } as unknown as UIMessage,
            )
            const retryText = (await chat({
              adapter: openaiText('gpt-5.2'),
              messages: convertMessagesToModelMessages(conversation) as never,
              systemPrompts: [...systemPrompts],
              tools: [fetchTileJsonTool],
              agentLoopStrategy: maxIterations(3),
              stream: false,
              maxTokens: 4000,
            })) as string
            // Best-effort parse + schema + postProcess. If any step fails, return
            // the raw text — validateAndRetry's second validate() call will emit
            // diagnostics and surface validation_failed: true.
            try {
              const retryParsed = JSON.parse(stripCodeFences(retryText))
              const retryValid = aiResponseSchema.safeParse(retryParsed)
              if (!retryValid.success || !retryValid.data.envelope)
                return retryText
              return postProcess(retryValid.data.envelope)
            } catch {
              return retryText
            }
          },
          { getFunctionMeta },
        )

        const responsePayload: Record<string, unknown> = {
          ...successValidation.data,
        }
        if (result.diagnostics && result.diagnostics.length > 0) {
          responsePayload.diagnostics = result.diagnostics
        }
        if (result.validation_failed) {
          responsePayload.validation_failed = true
        }
        return Response.json(responsePayload)
      },
    },
  },
})
