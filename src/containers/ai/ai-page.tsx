import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { AiLayout } from './ai-layout'
import type { AiViewMode } from './ai-layout'
import { AiChat } from './chat/ai-chat'
import { JsonViewer } from './json/json-viewer'
import { RendererSwitch } from './map/renderer-switch'
import { ExportMenu, buildFilename } from './export/export-menu'
import { ConfigPanel } from './config/config-panel'
import { MyAreaPanel } from './sidebar/my-area-panel'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { ParamsPanel } from '#/containers/playground/params-panel'
import { PaneErrorBoundary } from '#/components/pane-error-boundary'
import { useResolutionPipeline } from '#/lib/pipeline'
import { useChat } from '#/hooks/use-chat'
import { useActiveChatId } from '#/hooks/use-active-chat-id'
import {
  createChat,
  deleteChat,
  renameChat,
  setActiveMessage,
  setRenderer,
} from '#/lib/ai/persistence/chats'
import { setMessageParamValues } from '#/lib/ai/persistence/messages'
import { mergeParamDefaults } from '#/lib/ai/merge-param-defaults'
import { db } from '#/lib/ai/persistence/db'
import type { RendererControls } from '#/lib/ai/types'
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
  const [viewMode, setViewMode] = useState<AiViewMode>('chat')
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

  const activeMessage = useMemo(() => {
    if (!chat?.activeMessageId) return null
    return messages.find((m) => m.id === chat.activeMessageId) ?? null
  }, [chat?.activeMessageId, messages])

  const activeSnapshot: AiSchema | null = activeMessage?.schemaSnapshot ?? null

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

  const mergedSnapshot = useMemo(
    () =>
      activeSnapshot ? mergeParamDefaults(activeSnapshot, paramValues) : null,
    [activeSnapshot, paramValues],
  )

  const schemaJson = useMemo(
    () => (mergedSnapshot ? JSON.stringify(mergedSnapshot, null, 2) : ''),
    [mergedSnapshot],
  )

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
  }, [chatId, setChatId])

  const handleSelectChatFromMyArea = useCallback(
    (id: string) => {
      setChatId(id)
      setViewMode('chat')
    },
    [setChatId],
  )

  const handleNewChat = useCallback(async () => {
    const fresh = await createChat()
    setChatId(fresh.id)
    setViewMode('chat')
  }, [setChatId])

  const exportActions = (
    <ExportMenu
      schemaJson={schemaJson}
      filename={buildFilename(activeSnapshot?.metadata.title)}
      onError={(msg) => toast.error(`Export failed: ${msg}`)}
    />
  )

  const newChatAction = (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => void handleNewChat()}
            aria-label="New chat"
          >
            <Plus />
          </Button>
        }
      />
      <TooltipContent>New chat</TooltipContent>
    </Tooltip>
  )

  const editableTitle = chat
    ? {
        value: chat.title,
        onRename: (next: string) => void renameChat(chat.id, next),
      }
    : 'Loading…'

  return (
    <AiLayout
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onNewChat={() => void handleNewChat()}
      panels={{
        chat: {
          title: editableTitle,
          actions: exportActions,
          body: (
            <PaneErrorBoundary label="Chat" resetKey={chatId}>
              {chat ? (
                <AiChat
                  chat={chat}
                  messages={messages}
                  activeMessageId={chat.activeMessageId}
                  onSelectMessage={handleSelectMessage}
                  onClear={handleClear}
                  promptChips={PROMPT_CHIPS}
                />
              ) : (
                <div className="p-3 text-xs text-muted-foreground">
                  Loading chat…
                </div>
              )}
            </PaneErrorBoundary>
          ),
        },
        json: {
          title: editableTitle,
          actions: exportActions,
          body: (
            <PaneErrorBoundary label="JSON viewer" resetKey={schemaJson}>
              <JsonViewer json={schemaJson} />
            </PaneErrorBoundary>
          ),
        },
        config: {
          title: editableTitle,
          actions: exportActions,
          body: (
            <PaneErrorBoundary label="Config" resetKey={chatId}>
              {chat ? (
                <ConfigPanel
                  renderer={chat.renderer}
                  onRendererChange={(r) => void handleRendererChange(r)}
                />
              ) : null}
            </PaneErrorBoundary>
          ),
        },
        'my-area': {
          title: 'My area',
          actions: newChatAction,
          body: (
            <PaneErrorBoundary label="My area" resetKey={chatId ?? 'none'}>
              <MyAreaPanel
                activeChatId={chatId}
                onSelectChat={handleSelectChatFromMyArea}
              />
            </PaneErrorBoundary>
          ),
        },
      }}
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
  )
}
