import { useState } from 'react'
import { useChat, fetchServerSentEvents } from '@tanstack/ai-react'
import type { UIMessage } from '@tanstack/ai-react'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import type { RendererControls } from '#/lib/ai/types'
import type { AiOutput } from '#/lib/ai/output-schema'
import { aiOutputSchema } from '#/lib/ai/output-schema'

type AiChatProps = {
  readonly renderer: RendererControls
  readonly onResult: (output: AiOutput) => void
  readonly onError: (message: string) => void
  readonly promptChips: readonly string[]
}

type MessagePart = UIMessage['parts'][number]
type TextPart = Extract<MessagePart, { type: 'text' }>

function isTextPart(part: MessagePart): part is TextPart {
  return part.type === 'text'
}

function extractTextContent(parts: ReadonlyArray<MessagePart>): string {
  return parts
    .filter(isTextPart)
    .map((p) => p.content)
    .join('')
}

export function AiChat({
  renderer,
  onResult,
  onError,
  promptChips,
}: AiChatProps) {
  const [draft, setDraft] = useState('')

  const { messages, sendMessage, isLoading, stop, clear, error } = useChat({
    connection: fetchServerSentEvents('/api/ai-generate', {
      body: {
        renderer: renderer.renderer,
        mapboxToken: renderer.mapboxToken,
        mapboxStyleUrl: renderer.mapboxStyleUrl,
      },
    }),
    onFinish: (msg) => {
      try {
        const text = extractTextContent(msg.parts)
        const parsed = aiOutputSchema.parse(JSON.parse(text))
        onResult(parsed)
      } catch (err) {
        onError(err instanceof Error ? err.message : String(err))
      }
    },
    onError: (err) => onError(err.message),
  })

  function submit() {
    const trimmed = draft.trim()
    if (!trimmed) return
    sendMessage(trimmed)
    setDraft('')
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
        {messages.map((m) => {
          const textContent = extractTextContent(m.parts)
          return (
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
              <span className="whitespace-pre-wrap font-mono text-xs">
                {textContent}
              </span>
            </div>
          )
        })}
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
