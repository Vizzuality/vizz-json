import type { ExampleConfig } from "#/lib/types";

import example01 from "./01-raster-opacity.json";
import example02 from "./02-vector-fill.json";

export const examples: readonly ExampleConfig[] = [
  example01 as ExampleConfig,
  example02 as ExampleConfig,
];

export function getExampleById(index: number): ExampleConfig | undefined {
  return examples[index];
}
