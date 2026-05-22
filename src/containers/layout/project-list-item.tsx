import { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'
import type { Chat } from '#/lib/ai/persistence/types'
import RenameChatDialog from '#/containers/layout/rename-chat-dialog'
import DeleteChatAlert from '#/containers/layout/delete-chat-alert'

type Props = {
  chat: Chat
  isActive: boolean
  onSelect: (id: string) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  testOpenRename?: boolean
  testOpenDelete?: boolean
}

export default function ProjectListItem({
  chat,
  isActive,
  onSelect,
  onRename,
  onDelete,
  testOpenRename = false,
  testOpenDelete = false,
}: Props) {
  const [renameOpen, setRenameOpen] = useState(testOpenRename)
  const [deleteOpen, setDeleteOpen] = useState(testOpenDelete)

  return (
    <li
      className={cn(
        'group relative flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-colors',
        isActive
          ? 'border border-border bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-primary hover:text-primary-foreground',
      )}
    >
      <button
        type="button"
        className="min-w-0 flex-1 truncate text-left"
        onClick={() => onSelect(chat.id)}
      >
        {chat.title}
      </button>

      <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              render={
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="More options"
                      className={cn(
                        'hover:bg-primary-foreground/20',
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground group-hover:text-primary-foreground',
                      )}
                    />
                  }
                />
              }
            >
              <MoreVertical className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">More options</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <RenameChatDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentTitle={chat.title}
        onRename={(title) => onRename(chat.id, title)}
      />

      <DeleteChatAlert
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        chatTitle={chat.title}
        onConfirm={() => onDelete(chat.id)}
      />
    </li>
  )
}
