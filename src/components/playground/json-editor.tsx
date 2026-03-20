import { Editor } from '@monaco-editor/react'
import type { OnMount } from '@monaco-editor/react'
import { useCallback, useRef } from 'react'

type JsonEditorProps = {
  readonly value: string
  readonly onChange: (value: string) => void
}

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor
  }, [])

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue !== undefined) {
        onChange(newValue)
      }
    },
    [onChange],
  )

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-1.5 border-b bg-background flex justify-between items-center">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          @@ Config JSON
        </span>
        <span className="text-[11px] text-muted-foreground/50">
          config.json
        </span>
      </div>
      <div className="flex-1">
        <Editor
          defaultLanguage="json"
          theme="vs-dark"
          value={value}
          onChange={handleChange}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  )
}
