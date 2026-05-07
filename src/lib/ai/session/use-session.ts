import { useCallback, useRef, useState } from 'react'
import { useChat } from '#/hooks/use-chat'
import { runAiSession } from './run-session'
import type { UseAiSessionApi } from './types'

export function useAiSession(chatId: string | null): UseAiSessionApi {
  const { chat, messages } = useChat(chatId)
  const [isLoading, setIsLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

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

  const stop = useCallback((): void => {
    const controller = abortRef.current
    if (!controller) return
    abortRef.current = null
    controller.abort()
    setIsLoading(false)
  }, [])

  return { submit, stop, isLoading, lastError }
}
