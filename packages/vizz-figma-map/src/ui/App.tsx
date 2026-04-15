import { useEffect, useMemo, useRef, useState } from 'react'
import { createVizzJson } from '@vizzuality/vizz-json'
import exampleJson from '../examples/02-vector-fill.json'
import {
  BASEMAP_OPTIONS,
  type BasemapOption,
  type ExampleConfig,
  type ParamValues,
} from './types'
import { inferParamControl } from './lib/param-inference'
import { resolveParams } from './lib/resolve-params'
import { MapPreview, type MapPreviewHandle } from './components/map-preview'
import { ParamControls } from './components/param-controls'
import { StylePicker } from './components/style-picker'
import { rasterizeMap } from './lib/rasterize'
import { onMessageFromMain, postToMain } from './lib/messaging'
import type { ResolvedVizzConfig } from './lib/build-style'

const example = exampleJson as unknown as ExampleConfig

const EXPORT_WIDTH = 1200
const EXPORT_HEIGHT = 800

export function App() {
  const [basemapId, setBasemapId] = useState<BasemapOption['id']>('positron')
  const [values, setValues] = useState<ParamValues>(() =>
    Object.fromEntries(example.params_config.map((p) => [p.key, p.default])),
  )
  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'inserting' }
    | { kind: 'done' }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' })

  const previewRef = useRef<MapPreviewHandle | null>(null)

  const inferred = useMemo(
    () => example.params_config.map(inferParamControl),
    [],
  )

  const basemap = useMemo(
    () => BASEMAP_OPTIONS.find((o) => o.id === basemapId) ?? BASEMAP_OPTIONS[0],
    [basemapId],
  )

  const resolved: ResolvedVizzConfig = useMemo(() => {
    const paramsResolved = resolveParams(
      example.config as unknown as Record<string, unknown>,
      values,
    )
    const vizz = createVizzJson({})
    const out = vizz.resolve(paramsResolved)
    return out as unknown as ResolvedVizzConfig
  }, [values])

  // Listen for insert acknowledgements from main.
  useEffect(() => {
    return onMessageFromMain((msg) => {
      if (msg.type === 'INSERT_DONE') setStatus({ kind: 'done' })
      if (msg.type === 'INSERT_ERROR')
        setStatus({ kind: 'error', message: msg.error })
    })
  }, [])

  const handleParamChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleInsert = async () => {
    const map = previewRef.current?.getMap()
    const container = previewRef.current?.getContainer()
    if (!map || !container) return
    setStatus({ kind: 'inserting' })
    try {
      const bytes = await rasterizeMap(map, container, {
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
      })
      postToMain({
        type: 'INSERT_IMAGE',
        bytes,
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
      })
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen">
      <header className="p-3 border-b border-border">
        <h1 className="text-sm font-semibold">{example.metadata.title}</h1>
        <p className="text-xs text-text-secondary">
          {example.metadata.description}
        </p>
      </header>

      <div className="relative" style={{ height: 300 }}>
        <MapPreview
          ref={previewRef}
          basemapStyleUrl={basemap.styleUrl}
          resolved={resolved}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
        <StylePicker value={basemapId} onChange={setBasemapId} />
        <ParamControls
          params={inferred}
          values={values}
          onChange={handleParamChange}
        />
      </div>

      <footer className="p-3 border-t border-border flex items-center justify-between gap-2">
        <div className="text-xs text-text-secondary min-h-[1em]">
          {status.kind === 'inserting' && 'Inserting…'}
          {status.kind === 'done' && 'Inserted.'}
          {status.kind === 'error' && `Error: ${status.message}`}
        </div>
        <button
          onClick={handleInsert}
          disabled={status.kind === 'inserting'}
          className="h-8 px-4 rounded bg-brand text-brand-text text-sm disabled:opacity-50"
        >
          Insert into Figma
        </button>
      </footer>
    </div>
  )
}
