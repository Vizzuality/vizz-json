import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { useAiSession, parsePastedSnapshot } from '#/lib/ai/session'
import { cn } from '#/lib/utils'
import type { Chat, Message } from '#/lib/ai/persistence/types'

type Props = {
  readonly chat: Chat
  readonly messages: readonly Message[]
  readonly promptChips: readonly { label: string; prompt: string }[]
  readonly activeMessageId: string | null
  readonly onSelectMessage: (id: string) => void
}

export function AiChat({
  chat,
  messages,
  promptChips,
  activeMessageId,
  onSelectMessage,
}: Props) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const session = useAiSession(chat.id)

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
  }, [messages.length, session.isLoading])

  function submit(overridePrompt?: string) {
    const text = (overridePrompt ?? draft).trim()
    if (!text) return
    setDraft('')
    scrollToBottom()
    const snapshot = parsePastedSnapshot(text)
    if (snapshot) {
      void session.ingest(snapshot, text)
      return
    }
    void session.submit(text)
  }

  const hasAssistant = messages.some((m) => m.role === 'assistant')
  const canSubmit = !!draft.trim() && !session.isLoading

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="absolute inset-0 space-y-2 overflow-y-auto px-4 pt-4 pb-10 text-sm"
        >
          {!hasAssistant && promptChips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Try asking:</p>
              <div className="flex flex-col items-start gap-1.5">
                {promptChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => submit(chip.prompt)}
                    disabled={session.isLoading}
                    className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-xl border border-border bg-secondary px-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Bot className="size-4" />
                    {chip.label}
                  </button>
                ))}
              </div>
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
                className={cn(
                  m.role === 'user'
                    ? 'rounded-md bg-primary/10 p-2'
                    : 'rounded-md bg-muted p-2',
                  isAssistantWithSnap &&
                    'cursor-pointer hover:ring-1 hover:ring-primary',
                  isActive && 'ring-2 ring-primary',
                )}
              >
                <span className="block text-[10px] uppercase text-muted-foreground">
                  {m.role}
                  {isActive && ' · active'}
                </span>
                <span className="whitespace-pre-wrap text-xs">{m.text}</span>
              </div>
            )
          })}
          {session.isLoading && (
            <div className="rounded-md bg-muted p-2 text-xs italic">
              Generating…
            </div>
          )}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-background"
        />
      </div>
      {session.lastError && (
        <div className="mx-4 mb-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {session.lastError}
        </div>
      )}
      <div className="px-3 pb-3">
        <div className="relative">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="How would you like your map?"
            className="min-h-20 resize-none rounded-xl border-input bg-secondary px-3 py-2 pr-12 text-sm"
            rows={3}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              if (e.shiftKey) return
              if (e.nativeEvent.isComposing) return
              if (session.isLoading) return
              e.preventDefault()
              submit()
            }}
          />
          {session.isLoading ? (
            <Button
              size="icon-sm"
              variant="outline"
              onClick={session.stop}
              aria-label="Stop"
              className="absolute right-2 bottom-2"
            >
              <span className="size-2 rounded-xs bg-foreground" />
            </Button>
          ) : (
            <Button
              size="icon-sm"
              onClick={() => submit()}
              disabled={!canSubmit}
              aria-label="Send"
              className="absolute right-2 bottom-2 rounded-2xl"
            >
              <ArrowUp />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
