import type { LegendItem } from "#/lib/types";

type GradientLegendProps = { readonly items: readonly LegendItem[] };

export function GradientLegend({ items }: GradientLegendProps) {
  const colors = items
    .map((item) => (typeof item.value === "string" ? item.value : "#000"))
    .join(", ");

  return (
    <div>
      <div
        className="h-4 w-full rounded-sm"
        style={{ background: `linear-gradient(to right, ${colors})` }}
      />
      <div className="flex justify-between mt-1">
        {items.map((item, i) => (
          <span key={i} className="text-[10px] text-muted-foreground">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
