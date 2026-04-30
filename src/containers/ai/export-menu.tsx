import { Button } from '#/components/ui/button'

type Props = {
  readonly schemaJson: string
  readonly filename: string
}

export function ExportMenu({ schemaJson, filename }: Props) {
  const disabled = schemaJson.length === 0

  async function copy() {
    await navigator.clipboard.writeText(schemaJson)
  }

  function download() {
    const blob = new Blob([schemaJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={disabled} onClick={copy}>
        Copy
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={download}
      >
        Download
      </Button>
    </div>
  )
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export function buildFilename(title: string | undefined): string {
  const base = title ? slugify(title) : ''
  return base ? `vizz-${base}.json` : 'vizz-export.json'
}
