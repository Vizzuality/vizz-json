import { useCallback, useEffect, useRef, useState } from 'react'
import { useChat } from '#/hooks/use-chat'
import { runAiSession } from './run-session'
import { ingestSnapshot } from './ingest-snapshot'
import type { UseAiSessionApi } from './types'
import type { AiSchema } from '#/lib/ai/persistence/types'

export function useAiSession(chatId: string | null): UseAiSessionApi {
  const { chat, messages } = useChat(chatId)
  const [isLoading, setIsLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      const controller = abortRef.current
      if (!controller) return
      abortRef.current = null
      controller.abort()
      setIsLoading(false)
      setLastError(null)
    }
  }, [chatId])

  const submit = useCallback(
    async (prompt: string): Promise<void> => {
      const trimmed = prompt.trim()
      if (!trimmed) return
      if (!chat) return
      if (abortRef.current) return

      const controller = new AbortController()
      abortRef.current = controller
      setIsLoading(true)

      const result = await runAiSession({
        chat,
        history: messages,
        prompt: trimmed,
        signal: controller.signal,
      })

      if (abortRef.current !== controller) return
      abortRef.current = null
      setIsLoading(false)
      if (result.kind === 'error') setLastError(result.message)
      else setLastError(null)
    },
    [chat, messages],
  )

  const ingest = useCallback(
    async (snapshot: AiSchema, userText: string): Promise<void> => {
      if (!chat) return
      if (abortRef.current) return

      setIsLoading(true)
      const result = await ingestSnapshot({
        chat,
        history: messages,
        snapshot,
        userText,
      })
      setIsLoading(false)
      if (result.kind === 'error') setLastError(result.message)
      else setLastError(null)
    },
    [chat, messages],
  )

  const stop = useCallback((): void => {
    const controller = abortRef.current
    if (!controller) return
    abortRef.current = null
    controller.abort()
    setIsLoading(false)
  }, [])

  return { submit, ingest, stop, isLoading, lastError }
}
