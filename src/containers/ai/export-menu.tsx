import { Copy, Download } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'

type Props = {
  readonly schemaJson: string
  readonly filename: string
  readonly onError?: (message: string) => void
}

export function ExportMenu({ schemaJson, filename, onError }: Props) {
  const disabled = schemaJson.length === 0

  async function copy() {
    try {
      await navigator.clipboard.writeText(schemaJson)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : String(err))
    }
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
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-sm"
              variant="outline"
              disabled={disabled}
              onClick={copy}
              aria-label="Copy JSON"
            >
              <Copy />
            </Button>
          }
        />
        <TooltipContent>Copy JSON</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-sm"
              variant="outline"
              disabled={disabled}
              onClick={download}
              aria-label="Download JSON"
            >
              <Download />
            </Button>
          }
        />
        <TooltipContent>Download JSON</TooltipContent>
      </Tooltip>
    </>
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
