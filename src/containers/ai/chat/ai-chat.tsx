import { useEffect, useRef, useState } from 'react'
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
import { aiResponseSchema } from '#/lib/ai/output-schema'
import { postProcess } from '#/lib/ai/post-process'
import {
  appendUserMessage,
  appendAssistantMessage,
} from '#/lib/ai/persistence/messages'
import { renameChat } from '#/lib/ai/persistence/chats'
import type { AiSchema, Chat, Message } from '#/lib/ai/persistence/types'
import type { AiOutput } from '#/lib/ai/output-schema'

type Props = {
  readonly chat: Chat
  readonly messages: readonly Message[]
  readonly onResult: (output: AiOutput) => void
  readonly onError: (message: string) => void
  readonly onClear: () => void
  readonly promptChips: readonly string[]
  readonly activeMessageId: string | null
  readonly onSelectMessage: (id: string) => void
}

export function AiChat({
  chat,
  messages,
  onResult,
  onError,
  onClear,
  promptChips,
  activeMessageId,
  onSelectMessage,
}: Props) {
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  function scrollToBottom() {
    const el = scrollRef.current
    if (!el) return
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      el.scrollTop = el.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, isLoading])

  function stop() {
    abortRef.current?.abort()
    abortRef.current = null
    setIsLoading(false)
  }

  async function submit(overridePrompt?: string) {
    const trimmed = (overridePrompt ?? draft).trim()
    if (!trimmed || isLoading) return

    const chatId = chat.id
    const userMsg = await appendUserMessage(chatId, trimmed)
    if (messages.length === 0) {
      void renameChat(chatId, trimmed.slice(0, 40))
    }
    setDraft('')
    setIsLoading(true)
    scrollToBottom()

    const controller = new AbortController()
    abortRef.current = controller

    const history = [...messages, userMsg]

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
          renderer: chat.renderer.renderer,
          mapboxToken: chat.renderer.mapboxToken,
          mapboxStyleUrl: chat.renderer.mapboxStyleUrl,
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

      const snapshot = parsed.envelope
        ? (postProcess(parsed.envelope) as AiSchema)
        : undefined
      await appendAssistantMessage(chatId, parsed.reply, snapshot)
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

  const hasAssistant = messages.some((m) => m.role === 'assistant')

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto p-3 text-sm"
      >
        {!hasAssistant && promptChips.length > 0 && (
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
        {messages.map((m) => {
          const isAssistantWithSnap =
            m.role === 'assistant' && !!m.schemaSnapshot
          const isActive = m.id === activeMessageId
          return (
            <div
              key={m.id}
              onClick={() => {
                if (isAssistantWithSnap) onSelectMessage(m.id)
              }}
              onKeyDown={(e) => {
                if (!isAssistantWithSnap) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectMessage(m.id)
                }
              }}
              role={isAssistantWithSnap ? 'button' : undefined}
              tabIndex={isAssistantWithSnap ? 0 : -1}
              className={[
                m.role === 'user'
                  ? 'rounded-md bg-primary/10 p-2'
                  : 'rounded-md bg-muted p-2',
                isAssistantWithSnap
                  ? 'cursor-pointer hover:ring-1 hover:ring-primary'
                  : '',
                isActive ? 'ring-2 ring-primary' : '',
              ].join(' ')}
            >
              <span className="block text-[10px] uppercase text-muted-foreground">
                {m.role}
                {isActive && ' · active'}
              </span>
              <span className="whitespace-pre-wrap text-xs">{m.text}</span>
            </div>
          )
        })}
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
                  disabled={messages.length === 0}
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
                <AlertDialogAction
                  onClick={() => {
                    stop()
                    setConfirmOpen(false)
                    onClear()
                  }}
                >
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
