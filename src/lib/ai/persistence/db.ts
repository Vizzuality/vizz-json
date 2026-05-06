import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { Chat, Message, MetaRow } from './types'

class AiDb extends Dexie {
  chats!: Table<Chat, string>
  messages!: Table<Message, string>
  meta!: Table<MetaRow, string>

  constructor() {
    super('vizz-json-ai')
    this.version(1).stores({
      chats: '&id, updatedAt, title',
      messages: '&id, chatId, [chatId+createdAt]',
      meta: '&key',
    })
  }
}

export const db = new AiDb()
