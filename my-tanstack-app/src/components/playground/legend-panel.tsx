import type { LegendConfig } from "#/lib/types";
import { BasicLegend } from "#/components/legends/basic-legend";
import { ChoroplethLegend } from "#/components/legends/choropleth-legend";
import { GradientLegend } from "#/components/legends/gradient-legend";

type LegendPanelProps = { readonly config: LegendConfig | null };

const LEGEND_COMPONENTS = {
  basic: BasicLegend,
  choropleth: ChoroplethLegend,
  gradient: GradientLegend,
} as const;

export function LegendPanel({ config }: LegendPanelProps) {
  if (!config) return null;
  const LegendComponent = LEGEND_COMPONENTS[config.type];
  return (
    <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur border rounded-lg p-3 min-w-[140px]">
      <LegendComponent items={config.items} />
    </div>
  );
}
