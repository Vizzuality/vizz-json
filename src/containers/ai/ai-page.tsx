import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AiLayout } from './ai-layout'
import type { MainTab } from './ai-layout'
import { AiChat } from './chat/ai-chat'
import { JsonViewer } from './json/json-viewer'
import { RendererSwitch } from './map/renderer-switch'
import { MapHeader } from './map/map-header'
import { MapConfigDialog } from './map/map-config-dialog'
import { ParamsPanel } from '#/containers/playground/params-panel'
import { PaneErrorBoundary } from '#/components/pane-error-boundary'
import { useResolutionPipeline } from '#/lib/pipeline'
import { useChat } from '#/hooks/use-chat'
import { useActiveChatId } from '#/hooks/use-active-chat-id'
import {
  createChat,
  setActiveMessage,
  setRenderer,
} from '#/lib/ai/persistence/chats'
import { setMessageParamValues } from '#/lib/ai/persistence/messages'
import { db } from '#/lib/ai/persistence/db'
import { DEFAULT_MAP_VIEW } from '#/lib/ai/types'
import type { MapView, RendererControls } from '#/lib/ai/types'
import type { ResolvedParams } from '#/lib/types'
import type { AiSchema } from '#/lib/ai/persistence/types'

const PROMPT_CHIPS = [
  {
    label: 'Sentinel-2 imagery with opacity slider',
    prompt:
      'Add Sentinel-2 cloudless satellite imagery as a raster tile layer. Use the WMTS endpoint https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg with tileSize 256. Expose an opacity slider parameter (range 0 to 1, default 1).',
  },
  {
    label: 'Earthquake heatmap from Mapbox sample',
    prompt:
      'Render a heatmap of earthquakes. Use a single GeoJSON source pointing to https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson. Add one style layer of type "heatmap" with paint properties: heatmap-weight as ["interpolate", ["linear"], ["get", "mag"], 0, 0, 6, 1]; heatmap-intensity interpolated on ["zoom"]; heatmap-color interpolated on ["heatmap-density"] from transparent through a blue→yellow→red ramp; heatmap-radius interpolated on ["zoom"]; heatmap-opacity bound to an opacity parameter (0–1, default 0.8). Initial camera near zoom 1, centered globally.',
  },
  {
    label: 'US states choropleth by population',
    prompt:
      'Build a choropleth of US states using the GeoJSON at https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json. Color the states by the "density" numeric property as a proxy for population, using a graduated color scale, and include a legend.',
  },
  {
    label: 'Vector circles sized by magnitude',
    prompt:
      'Render earthquake points as circles. Use a single GeoJSON source pointing to https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson. Add one style layer of type "circle" with paint properties: circle-radius as ["interpolate", ["linear"], ["get", "mag"], 1, 2, 7, 14]; circle-color as ["interpolate", ["linear"], ["get", "mag"], 1, "#2c7bb6", 3, "#abd9e9", 5, "#fdae61", 7, "#d7191c"]; circle-opacity bound to an opacity parameter (0–1, default 0.8); circle-stroke-width 1; circle-stroke-color "#ffffff". Add a gradient legend mapping low→high magnitude.',
  },
] as const

export function AiPage() {
  const [mainTab, setMainTab] = useState<MainTab>('chat')
  const [configOpen, setConfigOpen] = useState(false)
  const { chatId, setChatId } = useActiveChatId()
  const { chat, messages } = useChat(chatId)
  const [liveView, setLiveView] = useState<MapView>(DEFAULT_MAP_VIEW)

  useEffect(() => {
    if (chat?.renderer.mapView) setLiveView(chat.renderer.mapView)
  }, [chat?.id, chat?.renderer.mapView])

  // Lazy-create first chat if none exists.
  useEffect(() => {
    if (chatId) return
    const state: { cancelled: boolean } = { cancelled: false }
    const isCancelled = () => state.cancelled
    void (async () => {
      const count = await db.chats.count()
      if (isCancelled() || count > 0) return
      const fresh = await createChat()
      if (isCancelled()) return
      setChatId(fresh.id)
    })()
    return () => {
      state.cancelled = true
    }
  }, [chatId, setChatId])

  const activeMessage = useMemo(() => {
    if (!chat?.activeMessageId) return null
    return messages.find((m) => m.id === chat.activeMessageId) ?? null
  }, [chat?.activeMessageId, messages])

  const activeSnapshot: AiSchema | null = activeMessage?.schemaSnapshot ?? null

  const schemaJson = useMemo(
    () => (activeSnapshot ? JSON.stringify(activeSnapshot, null, 2) : ''),
    [activeSnapshot],
  )

  const paramValues = useMemo<ResolvedParams>(() => {
    if (activeMessage?.paramValues) return activeMessage.paramValues
    if (!activeSnapshot) return {}
    const legacy = chat?.activeParamValues ?? {}
    const fallback: Record<string, unknown> = {}
    for (const param of activeSnapshot.params_config) {
      fallback[param.key] = Object.prototype.hasOwnProperty.call(
        legacy,
        param.key,
      )
        ? legacy[param.key]
        : param.default
    }
    return fallback
  }, [activeMessage?.paramValues, activeSnapshot, chat?.activeParamValues])

  const pipeline = useResolutionPipeline(
    activeSnapshot as Readonly<Record<string, unknown>> | null,
    paramValues,
  )
  const resolved =
    pipeline.output.kind === 'map' ? pipeline.output.resolvedConfig : null
  const error = pipeline.output.error

  const writeMessageParams = useCallback(
    async (messageId: string, next: ResolvedParams) => {
      try {
        await setMessageParamValues(messageId, next)
      } catch (err) {
        if ((err as Error).name === 'QuotaExceededError') {
          toast.error('Storage full — delete old chats to continue.')
        } else throw err
      }
    },
    [],
  )

  const handleParamChange = useCallback(
    (key: string, value: unknown) => {
      const messageId = chat?.activeMessageId
      if (!messageId) return
      const next: ResolvedParams = { ...paramValues, [key]: value }
      void writeMessageParams(messageId, next)
    },
    [chat?.activeMessageId, paramValues, writeMessageParams],
  )

  const handleSnapshotApply = useCallback(
    (updatedJson: string) => {
      const messageId = chat?.activeMessageId
      if (!messageId) return
      let parsed: AiSchema
      try {
        parsed = JSON.parse(updatedJson) as AiSchema
      } catch (err) {
        toast.error(
          `Failed to apply gradient edit: ${err instanceof Error ? err.message : String(err)}`,
        )
        return
      }
      void (async () => {
        try {
          await db.messages.update(messageId, { schemaSnapshot: parsed })
        } catch (err) {
          if ((err as Error).name === 'QuotaExceededError') {
            toast.error('Storage full — delete old chats to continue.')
          } else throw err
        }
      })()
    },
    [chat?.activeMessageId],
  )

  const handleRendererChange = useCallback(
    async (renderer: RendererControls) => {
      if (!chatId) return
      try {
        await setRenderer(chatId, renderer)
      } catch (err) {
        if ((err as Error).name === 'QuotaExceededError') {
          toast.error('Storage full — delete old chats to continue.')
        } else throw err
      }
    },
    [chatId],
  )

  const handleSelectMessage = useCallback(
    async (messageId: string) => {
      if (!chatId) return
      const msg = messages.find((m) => m.id === messageId)
      if (!msg?.schemaSnapshot) return
      await setActiveMessage(chatId, messageId)
    },
    [chatId, messages],
  )

  const renderer = chat?.renderer ?? { renderer: 'maplibre' as const }

  return (
    <>
      <AiLayout
        mainTab={mainTab}
        onMainTabChange={setMainTab}
        chat={
          <PaneErrorBoundary label="Chat" resetKey={chatId}>
            {chat ? (
              <AiChat
                chat={chat}
                messages={messages}
                activeMessageId={chat.activeMessageId}
                onSelectMessage={handleSelectMessage}
                promptChips={PROMPT_CHIPS}
              />
            ) : (
              <div className="p-3 text-xs text-muted-foreground">
                Loading chat…
              </div>
            )}
          </PaneErrorBoundary>
        }
        json={
          <PaneErrorBoundary label="JSON viewer" resetKey={schemaJson}>
            <JsonViewer json={schemaJson} />
          </PaneErrorBoundary>
        }
        map={
          <PaneErrorBoundary label="Map" resetKey={schemaJson}>
            <MapHeader
              view={liveView}
              renderer={renderer}
              onOpenConfig={() => setConfigOpen(true)}
            />
            <RendererSwitch
              resolvedConfig={resolved}
              error={error}
              renderer={renderer}
              onViewChange={setLiveView}
            />
          </PaneErrorBoundary>
        }
        params={
          <PaneErrorBoundary label="Params" resetKey={schemaJson}>
            {activeSnapshot ? (
              <ParamsPanel
                metadata={{
                  title: activeSnapshot.metadata.title,
                  tier: activeSnapshot.metadata.tier,
                }}
                paramsConfig={pipeline.inferredParams}
                legendConfig={pipeline.resolvedLegendConfig}
                legendParamMapping={pipeline.legendParamMapping}
                orphanLegendParams={pipeline.orphanLegendParams}
                values={paramValues}
                onChange={handleParamChange}
                currentJson={schemaJson}
                onApply={handleSnapshotApply}
              />
            ) : (
              <div className="p-3 text-xs text-muted-foreground">
                No schema yet — describe a map in the chat.
              </div>
            )}
          </PaneErrorBoundary>
        }
      />
      <MapConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        value={renderer}
        onSubmit={(next) => void handleRendererChange(next)}
      />
    </>
  )
}
