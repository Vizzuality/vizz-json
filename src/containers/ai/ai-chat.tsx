import { useRef, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import type { RendererControls } from '#/lib/ai/types'
import type { AiOutput } from '#/lib/ai/output-schema'
import { aiResponseSchema } from '#/lib/ai/output-schema'

type AiChatProps = {
  readonly renderer: RendererControls
  readonly onResult: (output: AiOutput) => void
  readonly onError: (message: string) => void
  readonly promptChips: readonly string[]
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function AiChat({
  renderer,
  onResult,
  onError,
  promptChips,
}: AiChatProps) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ReadonlyArray<ChatMessage>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  function stop() {
    abortRef.current?.abort()
    abortRef.current = null
    setIsLoading(false)
  }

  function clear() {
    stop()
    setMessages([])
    setError(null)
  }

  async function submit() {
    const trimmed = draft.trim()
    if (!trimmed || isLoading) return

    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      text: trimmed,
    }
    const history = [...messages, userMsg]
    setMessages(history)
    setDraft('')
    setError(null)
    setIsLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history.map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: 'text', content: m.text }],
          })),
          renderer: renderer.renderer,
          mapboxToken: renderer.mapboxToken,
          mapboxStyleUrl: renderer.mapboxStyleUrl,
        }),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(
          `Request failed (${res.status})${detail ? `: ${detail}` : ''}`,
        )
      }

      const json = await res.json()
      const parsed = aiResponseSchema.parse(json)

      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          text: parsed.reply,
        },
      ])
      onResult(parsed.envelope)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      onError(e.message)
    } finally {
      abortRef.current = null
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.length === 0 && promptChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {promptChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setDraft(chip)}
                className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === 'user'
                ? 'rounded-md bg-primary/10 p-2'
                : 'rounded-md bg-muted p-2'
            }
          >
            <span className="block text-[10px] uppercase text-muted-foreground">
              {m.role}
            </span>
            <span className="whitespace-pre-wrap text-xs">{m.text}</span>
          </div>
        ))}
        {isLoading && (
          <div className="rounded-md bg-muted p-2 text-xs italic">
            Generating…
          </div>
        )}
        {error && (
          <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            {error.message}
          </div>
        )}
      </div>
      <div className="border-t p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Describe a map…"
          className="text-sm"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
          }}
        />
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            onClick={submit}
            disabled={isLoading || !draft.trim()}
          >
            Send
          </Button>
          {isLoading && (
            <Button size="sm" variant="outline" onClick={stop}>
              Stop
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={clear} className="ml-auto">
            New chat
          </Button>
        </div>
      </div>
    </div>
  )
}
