import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
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
import { useAiSession } from '#/lib/ai/session'
import type { Chat, Message } from '#/lib/ai/persistence/types'

type Props = {
  readonly chat: Chat
  readonly messages: readonly Message[]
  readonly onClear: () => void
  readonly promptChips: readonly { label: string; prompt: string }[]
  readonly activeMessageId: string | null
  readonly onSelectMessage: (id: string) => void
}

export function AiChat({
  chat,
  messages,
  onClear,
  promptChips,
  activeMessageId,
  onSelectMessage,
}: Props) {
  const [draft, setDraft] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
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
    void session.submit(text)
  }

  const hasAssistant = messages.some((m) => m.role === 'assistant')

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto p-3 text-sm"
      >
        {!hasAssistant && promptChips.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Try one of these</p>
            <div className="flex flex-col items-start gap-1.5">
              {promptChips.map((chip) => (
                <Button
                  key={chip.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => submit(chip.prompt)}
                  disabled={session.isLoading}
                >
                  <Sparkles />
                  {chip.label}
                </Button>
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
        {session.isLoading && (
          <div className="rounded-md bg-muted p-2 text-xs italic">
            Generating…
          </div>
        )}
      </div>
      {session.lastError && (
        <div className="border-t bg-destructive/10 p-2 text-xs text-destructive">
          {session.lastError}
        </div>
      )}
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
            if (session.isLoading) return
            e.preventDefault()
            submit()
          }}
        />
        <div className="mt-2 flex gap-2">
          {session.isLoading ? (
            <Button size="sm" variant="outline" onClick={session.stop}>
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
                    session.stop()
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
