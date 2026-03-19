import type { LegendItem } from "#/lib/types";

type ChoroplethLegendProps = { readonly items: readonly LegendItem[] };

export function ChoroplethLegend({ items }: ChoroplethLegendProps) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-6 h-4 rounded-sm"
            style={{
              backgroundColor: typeof item.value === "string" ? item.value : undefined,
            }}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
