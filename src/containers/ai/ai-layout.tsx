import type { ReactNode } from 'react'
import { Bot, FileJson2, Layers } from 'lucide-react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'

export type MainTab = 'chat' | 'json'

type AiLayoutProps = {
  readonly mainTab: MainTab
  readonly onMainTabChange: (next: MainTab) => void
  readonly chat: ReactNode
  readonly json: ReactNode
  readonly map: ReactNode
  readonly params: ReactNode
  readonly validationOverlay?: ReactNode
}

export function AiLayout({
  mainTab,
  onMainTabChange,
  chat,
  json,
  map,
  params,
  validationOverlay,
}: AiLayoutProps) {
  return (
    <div className="flex h-full bg-background px-4 pb-4">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          id="ai-panel"
          defaultSize="420px"
          minSize="380px"
          groupResizeBehavior="preserve-pixel-size"
        >
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background py-4">
            <div className="shrink-0 px-4 pb-2">
              <Tabs
                value={mainTab}
                onValueChange={(v) => onMainTabChange(v as MainTab)}
              >
                <TabsList
                  size="lg"
                  className="w-full border border-border bg-secondary"
                >
                  <TabsTrigger value="chat">
                    <Bot />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="json">
                    <FileJson2 />
                    JSON
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="min-h-0 flex-1">
              {mainTab === 'chat' ? chat : json}
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle className="w-2 bg-transparent" />
        <ResizablePanel id="map" minSize="30%">
          <div className="flex h-full overflow-hidden rounded-2xl border border-border">
            <div className="flex h-full w-[300px] shrink-0 flex-col overflow-hidden border-r border-border bg-background">
              <div className="flex shrink-0 items-center gap-2 p-4">
                <Layers className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Data Layers
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{params}</div>
            </div>
            <div className="relative h-full min-w-0 flex-1 overflow-hidden">
              {map}
              {validationOverlay}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
