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
    <div className="absolute inset-0 z-10">
      <Editor
        defaultLanguage="json"
        theme="vs-dark"
        value={JSON.stringify(resolved, null, 2)}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
