import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '#/lib/ai/persistence/db'
import { migrateChat } from '#/lib/ai/persistence/migrations'
import type { Chat } from '#/lib/ai/persistence/types'

export function useChatList(): readonly Chat[] {
  const rows = useLiveQuery(
    () => db.chats.orderBy('updatedAt').reverse().toArray(),
    [],
  )
  return rows ? rows.map(migrateChat) : []
}
