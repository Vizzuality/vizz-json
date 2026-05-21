import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Monaco } from '@monaco-editor/react'
import { toast } from 'sonner'
import { AiLayout } from './ai-layout'
import type { MainTab } from './ai-layout'
import { AiChat } from './chat/ai-chat'
import { JsonViewer } from './json/json-viewer'
import { RendererSwitch } from './map/renderer-switch'
import { MapHeader } from './map/map-header'
import { MapConfigDialog } from './map/map-config-dialog'
import { LayersPanel } from './layers/layers-panel'
import { PaneErrorBoundary } from '#/components/pane-error-boundary'
import { useResolutionPipeline } from '#/lib/pipeline'
import { buildDefaultParams } from '#/lib/pipeline/build-default-params'
import { useChat } from '#/hooks/use-chat'
import { useActiveChatId } from '#/hooks/use-active-chat-id'
import {
  createChat,
  setActiveMessage,
  setRenderer,
} from '#/lib/ai/persistence/chats'
import { setMessageSnapshot } from '#/lib/ai/persistence/messages'
import { db } from '#/lib/ai/persistence/db'
import { DEFAULT_MAP_VIEW, initialBasemapForTheme } from '#/lib/ai/types'
import type { MapView, RendererControls } from '#/lib/ai/types'
import { isComponentExample } from '#/lib/types'
import type { MapExample, ResolvedParams, LayerSchema } from '#/lib/types'
import type { AiSchema } from '#/lib/ai/persistence/types'
import { migrateLegendShape } from '#/lib/ai/session/migrate-snapshot'
import { examples } from '#/examples'
import { ValidationBanner } from '#/containers/playground/validation-banner'
import {
  setValidationMarkers,
  jumpTo,
} from '#/containers/playground/monaco-markers'
import {
  extractLiteralColors,
  scaffoldLegendFromLayer,
} from '#/containers/playground/scaffold-actions'

type IStandaloneCodeEditor = Monaco['editor']['IStandaloneCodeEditor']

const EXAMPLE_CHIPS: readonly { label: string; snapshot: AiSchema }[] = examples
  .filter((e): e is MapExample => !isComponentExample(e))
  .map((e) => ({
    label: e.metadata.title,
    snapshot: {
      metadata: e.metadata,
      config: e.config as Record<string, unknown>,
      params_config: e.params_config,
    },
  }))

export function AiPage() {
  const [mainTab, setMainTab] = useState<MainTab>('chat')
  const [configOpen, setConfigOpen] = useState(false)
  const { chatId, setChatId } = useActiveChatId()
  const { chat, messages } = useChat(chatId)
  const [liveView, setLiveView] = useState<MapView>(DEFAULT_MAP_VIEW)

  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const monacoApiRef = useRef<Monaco | null>(null)

  useEffect(() => {
    if (chat?.renderer.mapView) setLiveView(chat.renderer.mapView)
  }, [chat?.id, chat?.renderer.mapView])

  useEffect(() => {
    if (chatId) return
    const state: { cancelled: boolean } = { cancelled: false }
    const isCancelled = () => state.cancelled
    void (async () => {
      const count = await db.chats.count()
      if (isCancelled() || count > 0) return
      const fresh = await createChat({
        renderer: 'maplibre',
        basemap: initialBasemapForTheme(),
      })
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

  const activeSnapshot: AiSchema | null = useMemo(
    () =>
      activeMessage?.schemaSnapshot
        ? migrateLegendShape(activeMessage.schemaSnapshot)
        : null,
    [activeMessage?.schemaSnapshot],
  )

  const schemaJson = useMemo(
    () => (activeSnapshot ? JSON.stringify(activeSnapshot, null, 2) : ''),
    [activeSnapshot],
  )

  const paramValues = useMemo<ResolvedParams>(
    () =>
      activeSnapshot ? buildDefaultParams(activeSnapshot.params_config) : {},
    [activeSnapshot],
  )

  const pipeline = useResolutionPipeline(
    activeSnapshot as Readonly<Record<string, unknown>> | null,
    paramValues,
  )
  const resolved =
    pipeline.output.kind === 'map' ? pipeline.output.resolvedConfig : null
  const error = pipeline.output.error
  const diagnostics = pipeline.diagnostics

  const persistSnapshot = useCallback(
    async (messageId: string, next: AiSchema) => {
      try {
        await setMessageSnapshot(messageId, next)
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
      if (!messageId || !activeSnapshot) return
      const nextParams = activeSnapshot.params_config.map((p) =>
        p.key === key ? { ...p, default: value } : p,
      )
      const next: AiSchema = { ...activeSnapshot, params_config: nextParams }
      void persistSnapshot(messageId, next)
    },
    [chat?.activeMessageId, activeSnapshot, persistSnapshot],
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
          `Failed to apply edit: ${err instanceof Error ? err.message : String(err)}`,
        )
        return
      }
      void persistSnapshot(messageId, parsed)
    },
    [chat?.activeMessageId, persistSnapshot],
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

  useEffect(() => {
    const editorInstance = editorRef.current
    const monacoApi = monacoApiRef.current
    if (!editorInstance || !monacoApi) return
    const model = editorInstance.getModel()
    if (!model) return
    setValidationMarkers(
      editorInstance,
      monacoApi,
      model,
      schemaJson,
      diagnostics,
    )
  }, [diagnostics, schemaJson])

  const handleExtractLiterals = useCallback(() => {
    const messageId = chat?.activeMessageId
    if (!messageId || !activeSnapshot) return
    const next = extractLiteralColors(activeSnapshot as unknown as LayerSchema)
    handleSnapshotApply(JSON.stringify(next, null, 2))
  }, [chat?.activeMessageId, activeSnapshot, handleSnapshotApply])

  const handleScaffoldLegend = useCallback(() => {
    const messageId = chat?.activeMessageId
    if (!messageId || !activeSnapshot) return
    const next = scaffoldLegendFromLayer(
      activeSnapshot as unknown as LayerSchema,
    )
    handleSnapshotApply(JSON.stringify(next, null, 2))
  }, [chat?.activeMessageId, activeSnapshot, handleSnapshotApply])

  const handleJumpTo = useCallback(
    (path: string) => {
      setMainTab('json')
      setTimeout(() => {
        jumpTo(editorRef.current, schemaJson, path)
      }, 100)
    },
    [schemaJson],
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
                chips={EXAMPLE_CHIPS}
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
            <JsonViewer
              json={schemaJson}
              onApply={handleSnapshotApply}
              onEditorMount={(editorInstance, monacoApi) => {
                editorRef.current = editorInstance
                monacoApiRef.current = monacoApi
                const model = editorInstance.getModel()
                if (model) {
                  setValidationMarkers(
                    editorInstance,
                    monacoApi,
                    model,
                    schemaJson,
                    diagnostics,
                  )
                }
              }}
            />
          </PaneErrorBoundary>
        }
        map={
          <PaneErrorBoundary label="Map" resetKey={schemaJson}>
            {chat ? (
              <>
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
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Loading map…
              </div>
            )}
          </PaneErrorBoundary>
        }
        params={
          <PaneErrorBoundary label="Params" resetKey={schemaJson}>
            {activeSnapshot ? (
              <LayersPanel
                metadata={{
                  title: activeSnapshot.metadata.title,
                  tier: activeSnapshot.metadata.tier,
                }}
                parsedConfig={pipeline.parsedConfig}
                pipeline={pipeline}
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
        validationOverlay={
          <ValidationBanner
            diagnostics={diagnostics}
            onJumpTo={handleJumpTo}
            onExtractLiterals={handleExtractLiterals}
            onScaffoldLegend={handleScaffoldLegend}
          />
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
