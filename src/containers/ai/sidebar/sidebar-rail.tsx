import { Braces, FolderOpen, MessageSquare, Settings } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'

export type AiViewMode = 'chat' | 'json' | 'config' | 'my-area'

type Item = {
  readonly value: AiViewMode
  readonly label: string
  readonly Icon: typeof MessageSquare
}

const TOP_ITEMS: readonly Item[] = [
  { value: 'chat', label: 'Chat', Icon: MessageSquare },
  { value: 'json', label: 'JSON', Icon: Braces },
  { value: 'config', label: 'Config', Icon: Settings },
]

const BOTTOM_ITEM: Item = {
  value: 'my-area',
  label: 'My area',
  Icon: FolderOpen,
}

type Props = {
  readonly value: AiViewMode
  readonly onChange: (next: AiViewMode) => void
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: Item
  active: boolean
  onClick: () => void
}) {
  const { Icon, label } = item
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={onClick}
            className={cn(
              'flex w-full cursor-pointer flex-col items-center gap-1 rounded-md px-2 py-2 text-[10px] font-medium text-muted-foreground transition-colors',
              'hover:bg-muted hover:text-foreground',
              active && 'bg-muted text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        }
      />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

export function SidebarRail({ value, onChange }: Props) {
  return (
    <nav
      aria-label="AI views"
      className="flex h-full w-[72px] shrink-0 flex-col gap-1 border-r bg-background p-2"
    >
      {TOP_ITEMS.map((item) => (
        <NavButton
          key={item.value}
          item={item}
          active={item.value === value}
          onClick={() => onChange(item.value)}
        />
      ))}
      <div className="mt-auto flex flex-col gap-1">
        <div className="border-t" />
        <NavButton
          item={BOTTOM_ITEM}
          active={BOTTOM_ITEM.value === value}
          onClick={() => onChange(BOTTOM_ITEM.value)}
        />
      </div>
    </nav>
  )
}
