import Editor from '@monaco-editor/react'

type Props = {
  readonly json: string
}

export function JsonViewer({ json }: Props) {
  return (
    <Editor
      height="100%"
      defaultLanguage="json"
      value={json}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 12,
        scrollBeyondLastLine: false,
      }}
    />
  )
}
