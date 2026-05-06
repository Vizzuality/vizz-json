import { useState } from 'react'
import type { ReactNode } from 'react'
import { Input } from '#/components/ui/input'

type EditableTitle = {
  readonly value: string
  readonly onRename: (next: string) => void
}

type Props = {
  readonly title: string | EditableTitle
  readonly actions?: ReactNode
}

function isEditable(t: Props['title']): t is EditableTitle {
  return typeof t === 'object' && 'onRename' in t
}

export function PanelHeader({ title, actions }: Props) {
  const editable = isEditable(title)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(editable ? title.value : '')

  function startEdit() {
    if (!editable) return
    setDraft(title.value)
    setEditing(true)
  }

  function commit() {
    if (!editable) return
    const next = draft.trim()
    if (next && next !== title.value) title.onRename(next)
    setEditing(false)
  }

  function cancel() {
    setEditing(false)
  }

  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {editable && editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') cancel()
            }}
            className="h-7 text-sm"
          />
        ) : editable ? (
          <button
            type="button"
            aria-label="Rename"
            onClick={startEdit}
            className="cursor-pointer truncate text-left text-sm font-medium hover:underline"
          >
            {title.value}
          </button>
        ) : (
          <span className="truncate text-sm font-medium">{title}</span>
        )}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
