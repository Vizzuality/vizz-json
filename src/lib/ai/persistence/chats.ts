import { db } from './db'
import { migrateChat } from './migrations'
import type { Chat } from './types'
import type { ResolvedParams } from '#/lib/types'
import type { RendererControls } from '#/lib/ai/types'

function uuid(): string {
  return crypto.randomUUID()
}

export async function createChat(): Promise<Chat> {
  const now = Date.now()
  const chat: Chat = {
    id: uuid(),
    title: 'New chat',
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    renderer: { renderer: 'maplibre' },
    activeParamValues: {},
    activeMessageId: null,
  }
  await db.chats.add(chat)
  return chat
}

export async function getChat(id: string): Promise<Chat | undefined> {
  const row = await db.chats.get(id)
  return row ? migrateChat(row) : undefined
}

export async function listChats(): Promise<Chat[]> {
  const rows = await db.chats.orderBy('updatedAt').reverse().toArray()
  return rows.map(migrateChat)
}

export async function renameChat(id: string, title: string): Promise<void> {
  await db.chats.update(id, { title, updatedAt: Date.now() })
}

export async function deleteChat(id: string): Promise<void> {
  await db.transaction('rw', db.chats, db.messages, async () => {
    await db.messages.where('chatId').equals(id).delete()
    await db.chats.delete(id)
  })
}

export async function setRenderer(
  id: string,
  renderer: RendererControls,
): Promise<void> {
  await db.chats.update(id, { renderer, updatedAt: Date.now() })
}

export async function setParamValues(
  id: string,
  activeParamValues: ResolvedParams,
): Promise<void> {
  await db.chats.update(id, { activeParamValues, updatedAt: Date.now() })
}

export async function setActiveMessage(
  id: string,
  activeMessageId: string | null,
): Promise<void> {
  await db.chats.update(id, { activeMessageId, updatedAt: Date.now() })
}

export async function touchChat(id: string): Promise<void> {
  await db.chats.update(id, { updatedAt: Date.now() })
}
