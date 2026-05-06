import { toast } from 'sonner'
import { useChatList } from '#/hooks/use-chat-list'
import { deleteChat, renameChat } from '#/lib/ai/persistence/chats'
import { db } from '#/lib/ai/persistence/db'
import type { Chat } from '#/lib/ai/persistence/types'
import { ChatRow } from './chat-row'

type Props = {
  readonly activeChatId: string | null
  readonly onSelectChat: (id: string) => void
}

export function MyAreaPanel({ activeChatId, onSelectChat }: Props) {
  const chats = useChatList()

  async function handleDelete(chat: Chat) {
    const messages = await db.messages.where('chatId').equals(chat.id).toArray()
    await deleteChat(chat.id)

    if (activeChatId === chat.id) {
      const remaining = await db.chats.orderBy('updatedAt').reverse().first()
      onSelectChat(remaining?.id ?? '')
    }

    toast('Chat deleted', {
      action: {
        label: 'Undo',
        onClick: async () => {
          await db.transaction('rw', db.chats, db.messages, async () => {
            await db.chats.add(chat)
            if (messages.length) await db.messages.bulkAdd(messages)
          })
          onSelectChat(chat.id)
        },
      },
      duration: 5000,
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
      {chats.length === 0 && (
        <p className="p-2 text-xs text-muted-foreground">No chats yet.</p>
      )}
      {chats.map((c) => (
        <ChatRow
          key={c.id}
          chat={c}
          active={c.id === activeChatId}
          onSelect={() => onSelectChat(c.id)}
          onRename={(t) => void renameChat(c.id, t)}
          onDelete={() => void handleDelete(c)}
        />
      ))}
    </div>
  )
}
