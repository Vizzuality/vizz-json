import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '#/lib/ai/persistence/db'
import { migrateChat, migrateMessage } from '#/lib/ai/persistence/migrations'
import type { Chat, Message } from '#/lib/ai/persistence/types'

export function useChat(chatId: string | null): {
  chat: Chat | null
  messages: readonly Message[]
} {
  const data = useLiveQuery(async () => {
    if (!chatId) return { chat: null, messages: [] as Message[] }
    const [chat, messages] = await Promise.all([
      db.chats.get(chatId),
      db.messages
        .where('[chatId+createdAt]')
        .between([chatId, -Infinity], [chatId, Infinity])
        .toArray(),
    ])
    return {
      chat: chat ? migrateChat(chat) : null,
      messages: messages.map(migrateMessage),
    }
  }, [chatId])

  return data ?? { chat: null, messages: [] }
}
