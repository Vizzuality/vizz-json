import Editor from '@monaco-editor/react'
import { useResolvedTheme } from '#/hooks/use-resolved-theme'

type Props = {
  readonly json: string
}

export function JsonViewer({ json }: Props) {
  const theme = useResolvedTheme()
  return (
    <Editor
      height="100%"
      defaultLanguage="json"
      value={json}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 12,
        scrollBeyondLastLine: false,
      }}
    />
  )
}
