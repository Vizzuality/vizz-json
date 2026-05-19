import type { ReactNode } from 'react'
import { Bot, FileJson2 } from 'lucide-react'
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
}

export function AiLayout({
  mainTab,
  onMainTabChange,
  chat,
  json,
  map,
  params,
}: AiLayoutProps) {
  return (
    <div className="flex h-full bg-background px-4 pt-2 pb-4">
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
          <div className="relative h-full overflow-hidden rounded-2xl border border-border">
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
