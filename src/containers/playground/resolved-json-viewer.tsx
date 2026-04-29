import Editor from '@monaco-editor/react'
import { useResolvedTheme } from '#/hooks/use-resolved-theme'

type ResolvedJsonViewerProps = {
  readonly resolved: Record<string, unknown> | null
  readonly visible: boolean
}

export function ResolvedJsonViewer({
  resolved,
  visible,
}: ResolvedJsonViewerProps) {
  const theme = useResolvedTheme()

  if (!visible || !resolved) return null

  return (
    <div className="absolute inset-0 z-10">
      <Editor
        defaultLanguage="json"
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
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
