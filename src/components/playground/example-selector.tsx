import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Badge } from '#/components/ui/badge'
import { examples } from '#/examples'

type ExampleSelectorProps = {
  readonly selectedIndex: number
  readonly onSelect: (index: number) => void
}

const TIER_COLORS = {
  basic: 'bg-green-950 text-green-400 border-green-800',
  intermediate: 'bg-yellow-950 text-yellow-400 border-yellow-800',
  advanced: 'bg-orange-950 text-orange-400 border-orange-800',
} as const

export function ExampleSelector({
  selectedIndex,
  onSelect,
}: ExampleSelectorProps) {
  return (
    <Select
      value={selectedIndex}
      onValueChange={(v: number | null) => {
        if (v !== null) onSelect(v)
      }}
    >
      <SelectTrigger size="lg" className="w-full px-3 text-sm font-medium">
        <SelectValue>
          {(value: number | null) =>
            value !== null ? (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${TIER_COLORS[examples[value]?.metadata.tier ?? 'basic']}`}
                >
                  {examples[value]?.metadata.tier}
                </Badge>
                {examples[value]?.metadata.title}
              </div>
            ) : (
              'Select example'
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {examples.map((ex, i) => (
          <SelectItem
            key={i}
            value={i}
            label={ex.metadata.title}
            className="text-sm py-2"
          >
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${TIER_COLORS[ex.metadata.tier]}`}
              >
                {ex.metadata.tier}
              </Badge>
              {ex.metadata.title}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
