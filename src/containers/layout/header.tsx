import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import { db } from '#/lib/ai/persistence/db'
import {
  createChat,
  renameChat,
  setActiveMessage,
} from '#/lib/ai/persistence/chats'
import { migrateMessage } from '#/lib/ai/persistence/migrations'
import { initialBasemapForTheme } from '#/lib/ai/types'

export default function Header() {
  const navigate = useNavigate()

  const activeChat = useLiveQuery(async () => {
    const meta = await db.meta.get('lastActiveChatId')
    if (!meta) return null
    const chat = await db.chats.get(meta.value)
    return chat ?? null
  }, [])

  const chatMessages = useLiveQuery(async () => {
    if (!activeChat?.id) return []
    const rows = await db.messages
      .where('[chatId+createdAt]')
      .between([activeChat.id, -Infinity], [activeChat.id, Infinity])
      .toArray()
    return rows.map(migrateMessage)
  }, [activeChat?.id])

  const versions = useMemo(() => {
    if (!chatMessages) return []
    const out: { id: string; index: number; title: string }[] = []
    for (const m of chatMessages) {
      if (m.role === 'assistant' && m.schemaSnapshot) {
        out.push({
          id: m.id,
          index: out.length + 1,
          title: m.schemaSnapshot.metadata.title,
        })
      }
    }
    return out
  }, [chatMessages])

  const activeVersion = versions.find(
    (v) => v.id === activeChat?.activeMessageId,
  )

  const [titleDraft, setTitleDraft] = useState('')

  useEffect(() => {
    setTitleDraft(activeChat?.title ?? '')
  }, [activeChat?.id, activeChat?.title])

  const commitTitle = () => {
    if (!activeChat) return
    const next = titleDraft.trim()
    if (!next || next === activeChat.title) {
      setTitleDraft(activeChat.title)
      return
    }
    void renameChat(activeChat.id, next)
  }

  const handleNewProject = async () => {
    const fresh = await createChat({
      renderer: 'maplibre',
      basemap: initialBasemapForTheme(),
    })
    await db.meta.put({ key: 'lastActiveChatId', value: fresh.id })
    void navigate({ to: '/playground', search: { chat: fresh.id } })
  }

  const isLoadingChat = activeChat === undefined
  const hasChat = !!activeChat

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center px-6 py-3">
        {/* Left: logo */}
        <div className="flex flex-1 items-center gap-2 px-2">
          <Link to="/" className="flex items-center gap-1 no-underline">
            <span className="font-mono text-lg text-accent">{'{@@}'}</span>
            <span className="font-sans text-lg font-bold tracking-tight text-foreground">
              vizz.json
            </span>
          </Link>
        </div>

        {/* Center: title + version */}
        <div className="flex items-center justify-center gap-1">
          {isLoadingChat ? (
            <>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </>
          ) : hasChat ? (
            <>
              <Input
                aria-label="Project name"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    ;(e.target as HTMLInputElement).blur()
                  }
                  if (e.key === 'Escape') {
                    setTitleDraft(activeChat.title)
                    ;(e.target as HTMLInputElement).blur()
                  }
                }}
                className="min-w-[8ch] [field-sizing:content]"
              />
              {versions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost">
                        {activeVersion
                          ? `Version ${activeVersion.index}`
                          : 'Version'}
                        <ChevronDown />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="center" className="min-w-56">
                    {versions.map((v) => {
                      const isActive = v.id === activeChat.activeMessageId
                      return (
                        <DropdownMenuItem
                          key={v.id}
                          onClick={() =>
                            void setActiveMessage(activeChat.id, v.id)
                          }
                        >
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">
                              {v.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Version {v.index}
                            </span>
                          </span>
                          {isActive && <Check className="size-4 shrink-0" />}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          ) : null}
        </div>

        {/* Right: actions */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <Button onClick={() => void handleNewProject()}>
            <Plus />
            New project
          </Button>
        </div>
      </div>
    </header>
  )
}
