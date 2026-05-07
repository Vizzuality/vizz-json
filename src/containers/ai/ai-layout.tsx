import type { ReactNode } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable'
import { PanelHeader } from './panel-header'
import { SidebarRail } from './sidebar/sidebar-rail'
import type { AiViewMode } from './sidebar/sidebar-rail'

export type { AiViewMode }

type EditableTitle = {
  readonly value: string
  readonly onRename: (next: string) => void
}

export type AiPanel = {
  readonly title: string | EditableTitle
  readonly actions?: ReactNode
  readonly body: ReactNode
}

type AiLayoutProps = {
  readonly viewMode: AiViewMode
  readonly onViewModeChange: (next: AiViewMode) => void
  readonly onNewChat: () => void
  readonly panels: Record<AiViewMode, AiPanel>
  readonly map: ReactNode
  readonly params: ReactNode
}

export function AiLayout({
  viewMode,
  onViewModeChange,
  onNewChat,
  panels,
  map,
  params,
}: AiLayoutProps) {
  const active = panels[viewMode]
  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      <SidebarRail
        value={viewMode}
        onChange={onViewModeChange}
        onNewChat={onNewChat}
      />
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          id="ai-panel"
          defaultSize="500px"
          minSize="400px"
          groupResizeBehavior="preserve-pixel-size"
        >
          <div className="flex h-full flex-col">
            <PanelHeader title={active.title} actions={active.actions} />
            <div className="min-h-0 flex-1">{active.body}</div>
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
