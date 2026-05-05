import { useRef, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog'
import type { RendererControls } from '#/lib/ai/types'
import type { AiOutput } from '#/lib/ai/output-schema'
import { aiResponseSchema } from '#/lib/ai/output-schema'

type AiChatProps = {
  readonly renderer: RendererControls
  readonly onResult: (output: AiOutput) => void
  readonly onError: (message: string) => void
  readonly onClear: () => void
  readonly promptChips: readonly string[]
  readonly hasSchema: boolean
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
  onClear,
  promptChips,
  hasSchema,
}: AiChatProps) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ReadonlyArray<ChatMessage>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function stop() {
    abortRef.current?.abort()
    abortRef.current = null
    setIsLoading(false)
  }

  function clear() {
    stop()
    setMessages([])
    setConfirmOpen(false)
    onClear()
  }

  async function submit(overridePrompt?: string) {
    const trimmed = (overridePrompt ?? draft).trim()
    if (!trimmed || isLoading) return

    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      text: trimmed,
    }
    const history = [...messages, userMsg]
    setMessages(history)
    setDraft('')
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
      if (parsed.envelope) onResult(parsed.envelope)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const e = err instanceof Error ? err : new Error(String(err))
      onError(e.message)
    } finally {
      abortRef.current = null
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {!messages.some((m) => m.role === 'assistant') &&
          promptChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {promptChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => submit(chip)}
                  disabled={isLoading}
                  className="rounded-full border px-3 py-1 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>
      <div className="border-t p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Describe a map…"
          className="text-sm"
          rows={3}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            if (e.shiftKey) return
            if (e.nativeEvent.isComposing) return
            if (isLoading) return
            e.preventDefault()
            submit()
          }}
        />
        <div className="mt-2 flex gap-2">
          {isLoading ? (
            <Button size="sm" variant="outline" onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button size="sm" onClick={() => submit()} disabled={!draft.trim()}>
              Send
            </Button>
          )}
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  disabled={messages.length === 0 && !hasSchema}
                >
                  Clear
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear chat?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the conversation and the generated map layer.
                  Renderer settings stay.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clear}>Clear</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
