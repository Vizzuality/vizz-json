import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronDown, Download, Plus, Upload } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import { useProject } from '#/lib/project-context'
import { db } from '#/lib/ai/persistence/db'
import { createChat, renameChat } from '#/lib/ai/persistence/chats'

export default function Header() {
  const { importJson, exportJson } = useProject()

  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeChat = useLiveQuery(async () => {
    const meta = await db.meta.get('lastActiveChatId')
    if (!meta) return null
    const chat = await db.chats.get(meta.value)
    return chat ?? null
  }, [])

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
    const fresh = await createChat()
    await db.meta.put({ key: 'lastActiveChatId', value: fresh.id })
    void navigate({ to: '/ai', search: { chat: fresh.id } })
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await importJson(file)
    e.target.value = ''
    void navigate({ to: '/playground' })
  }

  const handleExport = () => {
    exportJson(activeChat?.title)
  }

  const isLoadingChat = activeChat === undefined
  const hasChat = !!activeChat

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
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
              <Button variant="ghost">
                Version 1
                <ChevronDown />
              </Button>
            </>
          ) : null}
        </div>

        {/* Right: actions */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <Button onClick={() => void handleNewProject()}>
            <Plus />
            New project
          </Button>

          <Button onClick={handleImportClick}>
            <Download />
            Import
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button onClick={handleExport}>
            <Upload />
            Export
          </Button>
        </div>
      </div>
    </header>
  )
}
