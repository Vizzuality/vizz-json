import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "#/components/ui/resizable";

type PlaygroundLayoutProps = {
  readonly topBar: React.ReactNode;
  readonly editor: React.ReactNode;
  readonly map: React.ReactNode;
  readonly params: React.ReactNode;
};

export function PlaygroundLayout({
  topBar,
  editor,
  map,
  params,
}: PlaygroundLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {topBar}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize={40} minSize={25}>
          {editor}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={60} minSize={30}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={70} minSize={30}>
              {map}
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={30} minSize={15}>
              {params}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
