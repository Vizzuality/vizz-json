import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTitle: string
  onRename: (title: string) => void
}

export default function RenameChatDialog({
  open,
  onOpenChange,
  currentTitle,
  onRename,
}: Props) {
  const [draft, setDraft] = useState(currentTitle)

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(currentTitle)
    }
    onOpenChange(next)
  }

  function submit() {
    const trimmed = draft.trim()
    if (!trimmed) return
    onRename(trimmed)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
        </DialogHeader>
        <Input
          aria-label="Project name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') onOpenChange(false)
          }}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!draft.trim()}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
