import Editor from '@monaco-editor/react'

type ResolvedJsonViewerProps = {
  readonly resolved: Record<string, unknown> | null
  readonly visible: boolean
}

export function ResolvedJsonViewer({
  resolved,
  visible,
}: ResolvedJsonViewerProps) {
  if (!visible || !resolved) return null

  return (
    <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur">
      <div className="px-3 py-1.5 border-b flex justify-between items-center">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Resolved Output
        </span>
        <span className="text-[11px] text-muted-foreground/50">read-only</span>
      </div>
      <Editor
        defaultLanguage="json"
        theme="vs-dark"
        value={JSON.stringify(resolved, null, 2)}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 12,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
