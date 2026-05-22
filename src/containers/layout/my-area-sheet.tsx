import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Github, Menu, Plus, Presentation } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { Separator } from '#/components/ui/separator'
import { db } from '#/lib/ai/persistence/db'
import {
  createChat,
  deleteChat,
  listChats,
  renameChat,
} from '#/lib/ai/persistence/chats'
import { initialBasemapForTheme } from '#/lib/ai/types'
import ProjectListItem from '#/containers/layout/project-list-item'
import ThemeToggle from '#/containers/layout/theme-toggle'
import ParaglideLocaleSwitcher from '#/containers/layout/locale-switcher'

const GITHUB_URL = 'https://github.com/Vizzuality/vizz-json'

export default function MyAreaSheet() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const chatsData = useLiveQuery(async () => listChats(), [])
  const chats = Array.isArray(chatsData) ? chatsData : []
  const activeChatIdData = useLiveQuery(async () => {
    const row = await db.meta.get('lastActiveChatId')
    return row?.value ?? null
  }, [])
  const activeChatId =
    typeof activeChatIdData === 'string' ? activeChatIdData : null

  const handleSelect = (id: string) => {
    void db.meta.put({ key: 'lastActiveChatId', value: id })
    void navigate({ to: '/playground', search: { chat: id } })
    setOpen(false)
  }

  const handleRename = async (id: string, title: string) => {
    await renameChat(id, title)
  }

  const handleDelete = async (id: string) => {
    const wasActive = id === activeChatId
    await deleteChat(id)
    if (!wasActive) return
    await db.meta.delete('lastActiveChatId')
    void navigate({ to: '/playground', search: {} })
  }

  const handleNewProject = async () => {
    const fresh = await createChat({
      renderer: 'maplibre',
      basemap: initialBasemapForTheme(),
    })
    await db.meta.put({ key: 'lastActiveChatId', value: fresh.id })
    void navigate({ to: '/playground', search: { chat: fresh.id } })
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Open menu"
                />
              }
            />
          }
        >
          <Menu className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Open menu</TooltipContent>
      </Tooltip>
      <SheetContent side="left" className="w-80 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>All Projects</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-4">
          <Button
            type="button"
            onClick={() => void handleNewProject()}
            className="w-full justify-start"
          >
            <Plus className="size-4" />
            New project
          </Button>
        </div>

        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-2">
          {chats.map((chat) => (
            <ProjectListItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              onSelect={handleSelect}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-3 border-t border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle />
            <ParaglideLocaleSwitcher />
          </div>

          <Separator />

          <div className="flex flex-col gap-1 text-sm">
            <Link
              to="/presentation"
              search={{ slide: 1 }}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <Presentation className="size-4" />
              Presentation
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Github className="size-4" />
              GitHub
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
