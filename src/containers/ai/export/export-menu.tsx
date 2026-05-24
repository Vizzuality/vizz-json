import { Copy, Download, Image } from 'lucide-react'
import { useMap as useMaplibreMap } from 'react-map-gl/maplibre'
import { useMap as useMapboxMap } from 'react-map-gl/mapbox'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'

// ExportMenu exports the resolved AiSchema JSON and a PNG screenshot of the map canvas.
// Any future full-chat export MUST run the chat through
// stripSensitive() from src/lib/ai/persistence/strip-sensitive.ts
// to remove mapboxToken before serialization.

// Minimal shape covering both maplibre-gl and mapbox-gl Map instances.
// The union of their full types has incompatible `once` overloads, so we
// narrow to just the methods we actually call.
interface CanvasMap {
  triggerRepaint: () => void
  once: (type: string, listener: () => void) => unknown
  getCanvas: () => HTMLCanvasElement
}

type Props = {
  readonly schemaJson: string
  readonly jsonFilename: string
  readonly pngFilename: string
  readonly mapId: string
  readonly onError?: (message: string) => void
}

export function ExportMenu({
  schemaJson,
  jsonFilename,
  pngFilename,
  mapId,
  onError,
}: Props) {
  const jsonDisabled = schemaJson.length === 0

  const maplibreMaps = useMaplibreMap()
  const mapboxMaps = useMapboxMap()
  const mapRef = maplibreMaps[mapId] ?? mapboxMaps[mapId]

  async function copy() {
    try {
      await navigator.clipboard.writeText(schemaJson)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : String(err))
    }
  }

  function downloadJson() {
    const blob = new Blob([schemaJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = jsonFilename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadPng() {
    const rawMap = mapRef?.getMap()
    if (!rawMap) {
      onError?.('Map not ready')
      return
    }
    // Cast to the minimal CanvasMap interface — safe because both maplibre-gl
    // and mapbox-gl implement these three methods with identical runtime semantics.
    const map = rawMap as unknown as CanvasMap
    try {
      map.triggerRepaint()
      await new Promise<void>((resolve) => {
        map.once('idle', resolve)
      })
      const canvas = map.getCanvas()
      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = pngFilename
      a.click()
    } catch (err) {
      onError?.(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-sm"
              variant="outline"
              disabled={jsonDisabled}
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
              disabled={jsonDisabled}
              onClick={downloadJson}
              aria-label="Download JSON"
            >
              <Download />
            </Button>
          }
        />
        <TooltipContent>Download JSON</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-sm"
              variant="outline"
              disabled={mapRef === undefined}
              onClick={downloadPng}
              aria-label="Download PNG"
            >
              <Image />
            </Button>
          }
        />
        <TooltipContent>Download PNG</TooltipContent>
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

export function buildPngFilename(title: string | undefined): string {
  const base = title ? slugify(title) : ''
  return base ? `vizz-${base}.png` : 'vizz-export.png'
}
