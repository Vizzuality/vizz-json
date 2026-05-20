import { db } from './db'
import { migrateMessage } from './migrations'
import type { AiSchema, Message } from './types'

function uuid(): string {
  return crypto.randomUUID()
}

export async function appendUserMessage(
  chatId: string,
  text: string,
): Promise<Message> {
  const now = Date.now()
  const message: Message = {
    id: uuid(),
    chatId,
    role: 'user',
    text,
    createdAt: now,
    schemaVersion: 2,
  }
  await db.transaction('rw', db.chats, db.messages, async () => {
    await db.messages.add(message)
    await db.chats.update(chatId, { updatedAt: now })
  })
  return message
}

export async function appendAssistantMessage(
  chatId: string,
  text: string,
  schemaSnapshot?: AiSchema,
): Promise<Message> {
  const now = Date.now()
  const message: Message = {
    id: uuid(),
    chatId,
    role: 'assistant',
    text,
    createdAt: now,
    schemaVersion: 2,
    schemaSnapshot,
  }
  await db.transaction('rw', db.chats, db.messages, async () => {
    await db.messages.add(message)
    const patch: Record<string, unknown> = { updatedAt: now }
    if (schemaSnapshot) patch.activeMessageId = message.id
    await db.chats.update(chatId, patch)
  })
  return message
}

export async function setMessageSnapshot(
  messageId: string,
  schemaSnapshot: AiSchema,
): Promise<void> {
  // Clear the legacy v1 `paramValues` field so the v1→v2 migration doesn't
  // fold it back over a fresh snapshot. Dexie removes the field when the
  // value is `undefined`.
  await db.messages.update(messageId, {
    schemaSnapshot,
    schemaVersion: 2,
    paramValues: undefined,
  } as Partial<Message> & { paramValues?: undefined })
}

export async function listMessages(chatId: string): Promise<Message[]> {
  const rows = await db.messages
    .where('[chatId+createdAt]')
    .between([chatId, -Infinity], [chatId, Infinity])
    .toArray()
  return rows.map(migrateMessage)
}
