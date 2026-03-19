import type { LegendItem } from "#/lib/types";

type BasicLegendProps = { readonly items: readonly LegendItem[] };

export function BasicLegend({ items }: BasicLegendProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-sm border border-border"
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
