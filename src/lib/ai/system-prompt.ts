import type { RendererControls } from './types'
import { FEW_SHOT_EXAMPLES } from './few-shot'

const STATIC_PROMPT = `You generate VizzJson map configurations.

You output an envelope with this shape:

{
  "metadata": { "title": string, "description": string, "tier": "basic" | "intermediate" | "advanced" },
  "style": <plain MapLibre/Mapbox style fragment, no @@ prefixes>,
  "parameterize": [
    { "path": "styles[0].paint.raster-opacity", "key": "opacity", "default": 0.8, "min": 0, "max": 1, "step": 0.05 },
    ...
  ],
  "legend_config"?: { "type": "basic"|"choropleth"|"gradient", "items": [{ "label": string, "value": string|number }] }
}

Rules:
- The "style" you emit must be a *valid* style fragment for the requested renderer. Do NOT inject @@#params placeholders into "style"; the system substitutes them post hoc using "parameterize".
- "parameterize" entries reference paths inside "style". Use dot notation for objects and bracket notation for arrays, e.g. "styles[0].paint.fill-color".
- "parameterize" defaults must equal the literal value currently at that path.
- Numbers get min/max/step. Enumerated strings get options. Booleans get neither.
- Never include API tokens, secrets, or user-supplied keys in any field.
- The user's free-text data sources (URLs, property names) should be used verbatim. Do not invent property names.

Reference examples (input intent → output envelope shape):

${FEW_SHOT_EXAMPLES.map((ex, i) => `Example ${i + 1}:\n${JSON.stringify(ex, null, 2)}`).join('\n\n')}
`

function rendererAddendum(controls: RendererControls): string {
  if (controls.renderer === 'mapbox') {
    const styleNote = controls.mapboxStyleUrl
      ? `The user wants the basemap style ${controls.mapboxStyleUrl}. Reference it as the basemap context.`
      : `No Mapbox style URL was supplied; design the layer assuming a default Mapbox basemap.`
    return `Renderer: Mapbox GL JS v3. mapbox:// URLs are allowed in tile/source/style references. ${styleNote}`
  }
  return `Renderer: MapLibre GL JS. Do NOT use mapbox:// URLs or Mapbox-only style spec features (model layer, fog, fill-extrusion-edge-radius, etc.). Stick to MapLibre style spec.`
}

export function buildSystemPrompts(
  controls: RendererControls,
): readonly string[] {
  return [STATIC_PROMPT, rendererAddendum(controls)]
}
