import { useState } from 'react'
import { AiLayout } from './ai-layout'

export function AiPage() {
  const [viewMode, setViewMode] = useState<'chat' | 'json'>('chat')

  return (
    <AiLayout
      viewMode={viewMode}
      toolbar={
        <div className="flex h-12 items-center justify-between border-b px-4">
          <span className="font-mono text-sm">/ai</span>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => setViewMode((m) => (m === 'chat' ? 'json' : 'chat'))}
          >
            {viewMode === 'chat' ? 'Show JSON' : 'Show chat'}
          </button>
        </div>
      }
      chat={<div className="p-4 text-muted-foreground">Chat placeholder</div>}
      viewer={<div className="p-4 text-muted-foreground">JSON placeholder</div>}
      map={<div className="h-full bg-muted" />}
      params={<div className="p-3 text-sm">No params yet</div>}
    />
  )
}
