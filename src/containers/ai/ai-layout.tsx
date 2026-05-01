import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable'

type AiLayoutProps = {
  readonly viewMode: 'chat' | 'json' | 'config'
  readonly chat: React.ReactNode
  readonly viewer: React.ReactNode
  readonly config: React.ReactNode
  readonly map: React.ReactNode
  readonly params: React.ReactNode
  readonly toolbar: React.ReactNode
}

export function AiLayout({
  viewMode,
  chat,
  viewer,
  config,
  map,
  params,
  toolbar,
}: AiLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      <ResizablePanelGroup
        orientation="horizontal"
        defaultLayout={{ chat: 40, map: 60 }}
      >
        <ResizablePanel id="chat" minSize="25%">
          <div className="flex h-full flex-col">
            {toolbar}
            <div className="relative min-h-0 flex-1">
              <div className={viewMode === 'chat' ? 'h-full' : 'hidden'}>
                {chat}
              </div>
              <div className={viewMode === 'json' ? 'h-full' : 'hidden'}>
                {viewer}
              </div>
              <div className={viewMode === 'config' ? 'h-full' : 'hidden'}>
                {config}
              </div>
            </div>
          </div>
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
