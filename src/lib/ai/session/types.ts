import type { AiOutput } from '#/lib/ai/output-schema'
import type { AiSchema, Chat, Message } from '#/lib/ai/persistence/types'

export type AiSessionResult =
  | {
      readonly kind: 'ok'
      readonly envelope: AiOutput
      readonly snapshot: AiSchema
      readonly replyText: string
    }
  | { readonly kind: 'reply-only'; readonly replyText: string }
  | { readonly kind: 'soft-fail' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'aborted' }

export type AiSessionOptions = {
  readonly chat: Chat
  readonly history: readonly Message[]
  readonly prompt: string
  readonly signal: AbortSignal
}

export type UseAiSessionApi = {
  readonly submit: (prompt: string) => Promise<void>
  readonly stop: () => void
  readonly isLoading: boolean
  readonly lastError: string | null
}
