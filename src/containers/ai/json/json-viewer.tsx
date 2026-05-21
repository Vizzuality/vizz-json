import Editor from '@monaco-editor/react'
import type { Monaco, OnMount } from '@monaco-editor/react'
import { useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import { useResolvedTheme } from '#/hooks/use-resolved-theme'

type IStandaloneCodeEditor = Monaco['editor']['IStandaloneCodeEditor']

type Props = {
  readonly json: string
  readonly onApply?: (next: string) => void
  readonly onEditorMount?: (
    editorInstance: IStandaloneCodeEditor,
    monacoApi: Monaco,
  ) => void
}

export function JsonViewer({ json, onApply, onEditorMount }: Props) {
  const theme = useResolvedTheme()
  const editable = Boolean(onApply)
  const [draft, setDraft] = useState(json)

  useEffect(() => {
    setDraft(json)
  }, [json])

  const dirty = draft !== json
  let parseError: string | null = null
  if (dirty) {
    try {
      JSON.parse(draft)
    } catch (err) {
      parseError = err instanceof Error ? err.message : String(err)
    }
  }

  const handleMount: OnMount = (editorInstance, monacoApi) => {
    onEditorMount?.(editorInstance, monacoApi)
  }

  return (
    <div className="flex h-full flex-col">
      {editable && (
        <div className="flex items-center justify-between gap-2 border-b px-2 py-1.5">
          <span className="truncate text-xs text-muted-foreground">
            {dirty
              ? parseError
                ? `Invalid JSON: ${parseError}`
                : 'Unsaved changes'
              : 'In sync'}
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={!dirty}
              onClick={() => setDraft(json)}
            >
              Revert
            </Button>
            <Button
              size="sm"
              disabled={!dirty || parseError !== null}
              onClick={() => onApply?.(draft)}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={draft}
          onChange={(value) => setDraft(value ?? '')}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            readOnly: !editable,
            minimap: { enabled: false },
            fontSize: 12,
            scrollBeyondLastLine: false,
          }}
          onMount={handleMount}
        />
      </div>
    </div>
  )
}
