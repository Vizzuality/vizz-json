import type { Chat, Message } from './types'

const CURRENT_CHAT_VERSION = 1
const CURRENT_MESSAGE_VERSION = 1

export function migrateChat(row: Chat): Chat {
  if ((row.schemaVersion as number) === CURRENT_CHAT_VERSION) return row
  throw new Error(`Unknown chat schemaVersion: ${row.schemaVersion}`)
}

export function migrateMessage(row: Message): Message {
  if ((row.schemaVersion as number) === CURRENT_MESSAGE_VERSION) return row
  throw new Error(`Unknown message schemaVersion: ${row.schemaVersion}`)
}
