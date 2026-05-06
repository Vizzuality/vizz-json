import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AiLayout } from './ai-layout'
import type { AiViewMode } from './ai-layout'
import { AiChat } from './chat/ai-chat'
import { JsonViewer } from './json/json-viewer'
import { RendererSwitch } from './map/renderer-switch'
import { ExportMenu, buildFilename } from './export/export-menu'
import { ConfigPanel } from './config/config-panel'
import { ChatDrawer } from './sidebar/chat-drawer'
import { ParamsPanel } from '#/containers/playground/params-panel'
import { PaneErrorBoundary } from '#/components/pane-error-boundary'
import { useConverter } from '#/hooks/use-converter'
import { inferParamControl } from '#/lib/param-inference'
import { postProcess } from '#/lib/ai/post-process'
import { useChat } from '#/hooks/use-chat'
import { useActiveChatId } from '#/hooks/use-active-chat-id'
import {
  createChat,
  deleteChat,
  renameChat,
  setActiveMessage,
  setParamValues,
  setRenderer,
} from '#/lib/ai/persistence/chats'
import { db } from '#/lib/ai/persistence/db'
import type { AiOutput } from '#/lib/ai/output-schema'
import type { RendererControls } from '#/lib/ai/types'
import type { ResolvedParams, ParamConfig } from '#/lib/types'
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

function buildDefaultParams(
  paramsConfig: readonly ParamConfig[],
): ResolvedParams {
  return Object.fromEntries(paramsConfig.map((p) => [p.key, p.default]))
}

export function AiPage() {
  const [viewMode, setViewMode] = useState<AiViewMode>('chat')
  const [chatError, setChatError] = useState<string | null>(null)
  const { chatId, setChatId } = useActiveChatId()
  const { chat, messages } = useChat(chatId)

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

  const activeSnapshot: AiSchema | null = useMemo(() => {
    if (!chat?.activeMessageId) return null
    const msg = messages.find((m) => m.id === chat.activeMessageId)
    return msg?.schemaSnapshot ?? null
  }, [chat?.activeMessageId, messages])

  const schemaJson = useMemo(
    () => (activeSnapshot ? JSON.stringify(activeSnapshot, null, 2) : ''),
    [activeSnapshot],
  )

  const paramValues = chat?.activeParamValues ?? {}
  const { resolved, error } = useConverter(schemaJson || '{}', paramValues)

  const inferred = useMemo(
    () =>
      activeSnapshot ? activeSnapshot.params_config.map(inferParamControl) : [],
    [activeSnapshot],
  )

  const writeParams = useCallback(async (id: string, next: ResolvedParams) => {
    try {
      await setParamValues(id, next)
    } catch (err) {
      if ((err as Error).name === 'QuotaExceededError') {
        toast.error('Storage full — delete old chats to continue.')
      } else throw err
    }
  }, [])

  const handleParamChange = useCallback(
    (key: string, value: unknown) => {
      if (!chatId) return
      const next = { ...(chat?.activeParamValues ?? {}), [key]: value }
      void writeParams(chatId, next)
    },
    [chat?.activeParamValues, chatId, writeParams],
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

  const handleResult = useCallback(
    (output: AiOutput) => {
      if (!chat) return
      try {
        const processed = postProcess(output) as AiSchema
        void writeParams(chat.id, buildDefaultParams(processed.params_config))
        // Auto-title from schema metadata if still default or seeded from first message
        const firstUserText =
          messages.find((m) => m.role === 'user')?.text ?? ''
        const fallback = firstUserText.slice(0, 40)
        if (
          chat.title === 'New chat' ||
          chat.title === fallback ||
          chat.title === firstUserText
        ) {
          void renameChat(chat.id, processed.metadata.title)
        }
        setChatError(null)
      } catch (err) {
        setChatError(err instanceof Error ? err.message : String(err))
      }
    },
    [chat, messages, writeParams],
  )

  const handleSelectMessage = useCallback(
    async (messageId: string) => {
      if (!chatId) return
      const msg = messages.find((m) => m.id === messageId)
      if (!msg?.schemaSnapshot) return
      await setActiveMessage(chatId, messageId)
      await writeParams(
        chatId,
        buildDefaultParams(msg.schemaSnapshot.params_config),
      )
    },
    [chatId, messages, writeParams],
  )

  const handleClear = useCallback(async () => {
    if (!chatId) return
    await deleteChat(chatId)
    const remaining = await db.chats.orderBy('updatedAt').reverse().first()
    if (remaining) {
      setChatId(remaining.id)
    } else {
      const fresh = await createChat()
      setChatId(fresh.id)
    }
    setChatError(null)
  }, [chatId, setChatId])

  return (
    <AiLayout
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      chatHeaderLeft={
        <ChatDrawer activeChatId={chatId} onSelectChat={setChatId} />
      }
      toolbarActions={
        <ExportMenu
          schemaJson={schemaJson}
          filename={buildFilename(activeSnapshot?.metadata.title)}
          onError={setChatError}
        />
      }
      chat={
        <PaneErrorBoundary label="Chat" resetKey={chatId}>
          {chat ? (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1">
                <AiChat
                  chat={chat}
                  messages={messages}
                  activeMessageId={chat.activeMessageId}
                  onSelectMessage={handleSelectMessage}
                  onResult={handleResult}
                  onError={setChatError}
                  onClear={handleClear}
                  promptChips={PROMPT_CHIPS}
                />
              </div>
              {chatError && (
                <div className="border-t bg-destructive/10 p-2 text-xs text-destructive">
                  {chatError}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 text-xs text-muted-foreground">
              Loading chat…
            </div>
          )}
        </PaneErrorBoundary>
      }
      viewer={
        <PaneErrorBoundary label="JSON viewer" resetKey={schemaJson}>
          <JsonViewer json={schemaJson} />
        </PaneErrorBoundary>
      }
      config={
        <PaneErrorBoundary label="Config" resetKey={chatId}>
          {chat ? (
            <ConfigPanel
              renderer={chat.renderer}
              onRendererChange={(r) => void handleRendererChange(r)}
            />
          ) : null}
        </PaneErrorBoundary>
      }
      map={
        <PaneErrorBoundary label="Map" resetKey={schemaJson}>
          <RendererSwitch
            resolvedConfig={resolved}
            error={error}
            renderer={chat?.renderer ?? { renderer: 'maplibre' }}
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
              paramsConfig={inferred}
              legendConfig={activeSnapshot.legend_config ?? null}
              rawLegendConfig={null}
              values={paramValues}
              onChange={handleParamChange}
            />
          ) : (
            <div className="p-3 text-xs text-muted-foreground">
              No schema yet — describe a map in the chat.
            </div>
          )}
        </PaneErrorBoundary>
      }
    />
  )
}
