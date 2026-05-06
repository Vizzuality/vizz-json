import { useState } from 'react'
import { Plus, Menu } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { Button } from '#/components/ui/button'
import { useChatList } from '#/hooks/use-chat-list'
import { createChat, deleteChat, renameChat } from '#/lib/ai/persistence/chats'
import { db } from '#/lib/ai/persistence/db'
import type { Chat } from '#/lib/ai/persistence/types'
import { ChatRow } from './chat-row'

type Props = {
  activeChatId: string | null
  onSelectChat: (id: string) => void
}

export function ChatDrawer({ activeChatId, onSelectChat }: Props) {
  const [open, setOpen] = useState(false)
  const chats = useChatList()

  async function handleNew() {
    const chat = await createChat()
    onSelectChat(chat.id)
    setOpen(false)
  }

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="icon" variant="ghost" aria-label="Open chat list">
            <Menu className="h-4 w-4" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-72 gap-0 p-0">
        <SheetHeader className="border-b p-3.5 pr-12">
          <SheetTitle className="text-sm">Chats</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {chats.length === 0 && (
            <p className="p-2 text-xs text-muted-foreground">No chats yet.</p>
          )}
          {chats.map((c) => (
            <ChatRow
              key={c.id}
              chat={c}
              active={c.id === activeChatId}
              onSelect={() => {
                onSelectChat(c.id)
                setOpen(false)
              }}
              onRename={(t) => void renameChat(c.id, t)}
              onDelete={() => void handleDelete(c)}
            />
          ))}
        </div>
        <div className="border-t bg-popover p-2">
          <Button size="lg" className="w-full" onClick={handleNew}>
            <Plus className="mr-1 h-4 w-4" /> New chat
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
