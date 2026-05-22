import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Github, Menu, Plus, Presentation, Trash2 } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog'
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

  const handleDeleteAll = async () => {
    await db.transaction('rw', db.chats, db.messages, db.meta, async () => {
      await Promise.all([
        db.chats.clear(),
        db.messages.clear(),
        db.meta.clear(),
      ])
    })
    void navigate({ to: '/playground', search: {} })
    setOpen(false)
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

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  disabled={chats.length === 0}
                >
                  <Trash2 className="size-4" />
                  Delete all projects
                </Button>
              }
            />
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all projects?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes every project, chat, and message
                  stored locally in your browser. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => void handleDeleteAll()}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Separator />

          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              render={
                <Link
                  to="/presentation"
                  search={{ slide: 1 }}
                  onClick={() => setOpen(false)}
                />
              }
            >
              <Presentation className="size-4" />
              Presentation
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              render={
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <Github className="size-4" />
              GitHub
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
