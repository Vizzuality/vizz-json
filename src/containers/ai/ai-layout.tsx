import { Braces, MessageSquare, Settings } from 'lucide-react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#/components/ui/tabs'

export type AiViewMode = 'chat' | 'json' | 'config'

type AiLayoutProps = {
  readonly viewMode: AiViewMode
  readonly onViewModeChange: (value: AiViewMode) => void
  readonly chat: React.ReactNode
  readonly viewer: React.ReactNode
  readonly config: React.ReactNode
  readonly map: React.ReactNode
  readonly params: React.ReactNode
  readonly toolbarActions?: React.ReactNode
}

export function AiLayout({
  viewMode,
  onViewModeChange,
  chat,
  viewer,
  config,
  map,
  params,
  toolbarActions,
}: AiLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      <ResizablePanelGroup
        orientation="horizontal"
        defaultLayout={{ chat: 40, map: 60 }}
      >
        <ResizablePanel id="chat" minSize="25%">
          <Tabs
            value={viewMode}
            onValueChange={(value) => onViewModeChange(value as AiViewMode)}
            className="flex h-full flex-col gap-0"
          >
            <div className="flex h-12 items-center justify-between border-b px-4">
              <TabsList>
                <TabsTrigger value="chat">
                  <MessageSquare />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="json">
                  <Braces />
                  JSON
                </TabsTrigger>
                <TabsTrigger value="config">
                  <Settings />
                  Config
                </TabsTrigger>
              </TabsList>
              {toolbarActions ? (
                <div className="flex items-center gap-2">{toolbarActions}</div>
              ) : null}
            </div>
            <TabsContent value="chat" keepMounted className="min-h-0">
              {chat}
            </TabsContent>
            <TabsContent value="json" className="min-h-0">
              {viewer}
            </TabsContent>
            <TabsContent value="config" keepMounted className="min-h-0">
              {config}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="map" minSize="30%">
          <div className="relative h-full">
            {map}
            <div className="absolute bottom-4 left-4 z-10 max-h-[60%] w-80 overflow-y-auto rounded-lg border bg-background/95 shadow-lg backdrop-blur">
              {params}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
