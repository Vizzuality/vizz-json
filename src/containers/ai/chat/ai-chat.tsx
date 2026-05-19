import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, Bot, Check, Square } from 'lucide-react'
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

type InputStatus = 'empty' | 'has-message' | 'stop'

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
  const hasDraft = !!draft.trim()

  // Per-message version index (count of preceding assistant snapshots).
  const versionByMessageId = useMemo(() => {
    const map = new Map<string, number>()
    let n = 0
    for (const m of messages) {
      if (m.role === 'assistant' && m.schemaSnapshot) {
        n += 1
        map.set(m.id, n)
      }
    }
    return map
  }, [messages])

  const inputStatus: InputStatus = session.isLoading
    ? 'stop'
    : hasDraft
      ? 'has-message'
      : 'empty'

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="absolute inset-0 flex flex-col gap-1 overflow-y-auto px-4 pt-4 pb-10"
        >
          {!hasAssistant && promptChips.length > 0 && (
            <div className="flex flex-col gap-[9px] pb-2">
              <p className="text-xs text-muted">Try asking:</p>
              <div className="flex flex-col items-start gap-[9px]">
                {promptChips.map((chip) => (
                  <Button
                    key={chip.label}
                    variant="chip"
                    onClick={() => submit(chip.prompt)}
                    disabled={session.isLoading}
                  >
                    <Bot />
                    {chip.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => {
            if (m.role === 'user') {
              return (
                <div
                  key={m.id}
                  className="flex w-full items-center justify-end rounded-tl-3xl rounded-tr-3xl rounded-bl-3xl bg-card px-4 py-3"
                >
                  <p className="flex-1 text-sm leading-5 text-muted">
                    {m.text}
                  </p>
                </div>
              )
            }
            const hasSnapshot = !!m.schemaSnapshot
            const isActive = m.id === activeMessageId
            const version = versionByMessageId.get(m.id)
            return (
              <div key={m.id} className="flex flex-col gap-1">
                {m.text && (
                  <div className="flex w-full items-center rounded-tl-3xl rounded-tr-3xl rounded-bl-3xl px-4 py-3">
                    <p className="flex-1 text-sm leading-5 whitespace-pre-wrap text-muted">
                      {m.text}
                    </p>
                  </div>
                )}
                {hasSnapshot && (
                  <Button
                    variant="card-outline"
                    size="card"
                    onClick={() => onSelectMessage(m.id)}
                    aria-pressed={isActive}
                    className="group/version"
                  >
                    <span
                      className={cn(
                        'flex min-w-0 flex-col gap-1 transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-50',
                      )}
                    >
                      <span className="truncate text-sm leading-5 font-medium">
                        {m.schemaSnapshot?.metadata.title ?? 'Untitled map'}
                      </span>
                      <span className="text-xs leading-4 text-muted">
                        {version ? `Version ${version}` : 'Version'}
                      </span>
                    </span>
                    {isActive ? (
                      <Check className="size-5 shrink-0" />
                    ) : (
                      <span className="hidden text-sm italic text-muted-foreground group-hover/version:inline">
                        Preview
                      </span>
                    )}
                  </Button>
                )}
              </div>
            )
          })}
          {session.isLoading && (
            <div className="flex items-center gap-1 py-2 pl-2">
              <Bot className="size-4 animate-pulse text-accent" />
              <span className="animate-[chat-generating-shimmer_2.2s_linear_infinite] bg-gradient-to-r from-accent/30 via-accent to-accent/30 bg-[length:200%_100%] bg-clip-text text-sm leading-5 font-medium text-transparent">
                Generating…
              </span>
            </div>
          )}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-background backdrop-blur-[2px]"
        />
      </div>
      {session.lastError && (
        <div className="mx-3 mb-2 rounded-xl border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {session.lastError}
        </div>
      )}
      <ChatInput
        status={inputStatus}
        value={draft}
        onChange={setDraft}
        onSubmit={() => submit()}
        onStop={session.stop}
      />
    </div>
  )
}

type ChatInputProps = {
  readonly status: InputStatus
  readonly value: string
  readonly onChange: (v: string) => void
  readonly onSubmit: () => void
  readonly onStop: () => void
}

function ChatInput({
  status,
  value,
  onChange,
  onSubmit,
  onStop,
}: ChatInputProps) {
  const isStop = status === 'stop'
  const isHasMessage = status === 'has-message'
  return (
    <div className="px-3 pt-3 pb-3">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="How would you like your map?"
          rows={3}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            if (e.shiftKey) return
            if (e.nativeEvent.isComposing) return
            if (isStop) return
            e.preventDefault()
            onSubmit()
          }}
          className={cn(
            'min-h-20 resize-none rounded-xl bg-secondary px-3 py-2 pr-12 text-sm leading-5 text-foreground transition-colors placeholder:text-muted-foreground focus-visible:ring-0',
            isHasMessage ? 'border-focus' : 'border-input',
          )}
        />
        {isStop ? (
          <span className="absolute right-2 bottom-2 inline-block overflow-hidden rounded-2xl p-0">
            <span
              aria-hidden
              className="absolute inset-[-50%] animate-[chat-tail-spin_1.4s_linear_infinite] bg-[conic-gradient(from_0deg,var(--color-accent)_0deg,var(--color-accent)_60deg,transparent_180deg)]"
            />
            <Button
              size="icon-xl"
              variant="default"
              onClick={onStop}
              aria-label="Stop"
              className="relative"
            >
              <Square />
            </Button>
          </span>
        ) : (
          <Button
            size="icon-xl"
            variant={isHasMessage ? 'accent' : 'default'}
            onClick={onSubmit}
            disabled={!isHasMessage}
            aria-label="Send"
            className="absolute right-2 bottom-2"
          >
            <ArrowUp />
          </Button>
        )}
      </div>
    </div>
  )
}
