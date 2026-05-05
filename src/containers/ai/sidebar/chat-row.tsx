import { useState } from 'react'
import { Trash2, Pencil, Check, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'
import type { Chat } from '#/lib/ai/persistence/types'

type Props = {
  chat: Chat
  active: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onDelete: () => void
}

export function ChatRow({ chat, active, onSelect, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(chat.title)

  if (editing) {
    return (
      <div className="flex items-center gap-1 p-2">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onRename(draft.trim() || chat.title)
              setEditing(false)
            }
            if (e.key === 'Escape') setEditing(false)
          }}
          className="h-7 text-xs"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            onRename(draft.trim() || chat.title)
            setEditing(false)
          }}
          aria-label="Save"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setEditing(false)}
          aria-label="Cancel"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-1 rounded-md px-2 py-1.5',
        active && 'bg-muted',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 truncate text-left text-xs"
      >
        {chat.title}
      </button>
      <Button
        size="icon"
        variant="ghost"
        className="opacity-0 group-hover:opacity-100"
        onClick={() => setEditing(true)}
        aria-label="Rename chat"
      >
        <Pencil className="h-3 w-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="opacity-0 group-hover:opacity-100"
        onClick={onDelete}
        aria-label="Delete chat"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}
