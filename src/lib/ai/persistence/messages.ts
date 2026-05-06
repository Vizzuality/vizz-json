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
    schemaVersion: 1,
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
    schemaVersion: 1,
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

export async function listMessages(chatId: string): Promise<Message[]> {
  const rows = await db.messages
    .where('[chatId+createdAt]')
    .between([chatId, -Infinity], [chatId, Infinity])
    .toArray()
  return rows.map(migrateMessage)
}
