import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Badge } from "#/components/ui/badge";
import { examples } from "#/examples";

type ExampleSelectorProps = {
  readonly selectedIndex: number;
  readonly onSelect: (index: number) => void;
};

const TIER_COLORS = {
  basic: "bg-green-950 text-green-400 border-green-800",
  intermediate: "bg-yellow-950 text-yellow-400 border-yellow-800",
  advanced: "bg-orange-950 text-orange-400 border-orange-800",
} as const;

export function ExampleSelector({ selectedIndex, onSelect }: ExampleSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
        Example:
      </span>
      <Select
        value={selectedIndex}
        onValueChange={(v: number | null) => { if (v !== null) onSelect(v); }}
      >
        <SelectTrigger className="h-8 w-[280px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {examples.map((ex, i) => (
            <SelectItem key={i} value={i} className="text-xs">
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
    </div>
  );
}
