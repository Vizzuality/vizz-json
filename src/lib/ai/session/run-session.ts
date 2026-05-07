import { aiResponseSchema } from '#/lib/ai/output-schema'
import {
  appendAssistantMessage,
  appendUserMessage,
} from '#/lib/ai/persistence/messages'
import { renameChat } from '#/lib/ai/persistence/chats'
import { postProcess } from '#/lib/ai/post-process'
import type { AiSchema } from '#/lib/ai/persistence/types'
import {
  shouldRenameOnEnvelope,
  shouldRenameOnFirstUserMessage,
} from './auto-rename'
import type { AiSessionOptions, AiSessionResult } from './types'

const SOFT_FAIL_REPLY =
  "I couldn't produce a valid map for that prompt. Try rephrasing or adding more detail."

export async function runAiSession(
  opts: AiSessionOptions,
): Promise<AiSessionResult> {
  const { chat, history, prompt, signal } = opts

  try {
    const userMsg = await appendUserMessage(chat.id, prompt)
    if (shouldRenameOnFirstUserMessage(history)) {
      await renameChat(chat.id, prompt.slice(0, 40))
    }

    const fullHistory = [...history, userMsg]
    const body = {
      messages: fullHistory.map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: 'text', content: m.text }],
      })),
      renderer: chat.renderer.renderer,
      mapboxToken: chat.renderer.mapboxToken,
      mapboxStyleUrl: chat.renderer.mapboxStyleUrl,
    }

    const res = await fetch('/api/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify(body),
    })

    if (res.status === 502) {
      await appendAssistantMessage(chat.id, SOFT_FAIL_REPLY)
      return { kind: 'soft-fail' }
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(
        `Request failed (${res.status})${detail ? `: ${detail}` : ''}`,
      )
    }

    const json = await res.json()
    const parsed = aiResponseSchema.parse(json)

    if (parsed.envelope) {
      const snapshot = postProcess(parsed.envelope) as AiSchema
      await appendAssistantMessage(chat.id, parsed.reply, snapshot)
      if (shouldRenameOnEnvelope(chat.title, prompt)) {
        await renameChat(chat.id, snapshot.metadata.title)
      }
      return {
        kind: 'ok',
        envelope: parsed.envelope,
        snapshot,
        replyText: parsed.reply,
      }
    }

    await appendAssistantMessage(chat.id, parsed.reply)
    return { kind: 'reply-only', replyText: parsed.reply }
  } catch (err) {
    const name = (err as { name?: unknown }).name
    if (name === 'AbortError') return { kind: 'aborted' }
    const message = err instanceof Error ? err.message : String(err)
    return { kind: 'error', message }
  }
}
