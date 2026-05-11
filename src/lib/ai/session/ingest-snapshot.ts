import {
  appendAssistantMessage,
  appendUserMessage,
} from '#/lib/ai/persistence/messages'
import { renameChat } from '#/lib/ai/persistence/chats'
import { reconcileParamValues } from '#/lib/ai/reconcile-param-values'
import type { AiSchema, Chat, Message } from '#/lib/ai/persistence/types'
import { shouldRenameOnFirstUserMessage } from './auto-rename'

const REPLY_TEXT = 'Imported pasted JSON.'

export type IngestSnapshotOptions = {
  readonly chat: Chat
  readonly history: readonly Message[]
  readonly snapshot: AiSchema
  readonly userText: string
}

export type IngestSnapshotResult =
  | {
      readonly kind: 'ok'
      readonly snapshot: AiSchema
      readonly replyText: string
    }
  | { readonly kind: 'error'; readonly message: string }

export async function ingestSnapshot(
  opts: IngestSnapshotOptions,
): Promise<IngestSnapshotResult> {
  const { chat, history, snapshot, userText } = opts
  try {
    await appendUserMessage(chat.id, userText)
    if (shouldRenameOnFirstUserMessage(history)) {
      await renameChat(chat.id, snapshot.metadata.title)
    }
    const activeMessage = history.find((m) => m.id === chat.activeMessageId)
    const currentParamValues =
      activeMessage?.paramValues ?? chat.activeParamValues
    const reconciled = reconcileParamValues(
      activeMessage?.schemaSnapshot ?? null,
      snapshot,
      currentParamValues,
    )
    await appendAssistantMessage(chat.id, REPLY_TEXT, snapshot, reconciled)
    return { kind: 'ok', snapshot, replyText: REPLY_TEXT }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { kind: 'error', message }
  }
}
