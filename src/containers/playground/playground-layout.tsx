import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable'

type PlaygroundLayoutProps = {
  readonly sidebarHeader: React.ReactNode
  readonly editor: React.ReactNode
  readonly map: React.ReactNode
  readonly params: React.ReactNode
}

export function PlaygroundLayout({
  sidebarHeader,
  editor,
  map,
  params,
}: PlaygroundLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="flex h-full flex-col">
            {sidebarHeader}
            <div className="relative min-h-0 flex-1">{editor}</div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={60} minSize={30}>
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
