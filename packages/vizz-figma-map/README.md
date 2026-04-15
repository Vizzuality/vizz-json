# vizz-figma-map

Figma plugin rendering vizz-json maps and inserting them into Figma documents as raster images.

## Develop

From the monorepo root:

```bash
pnpm install
pnpm --filter vizz-figma-map dev
```

This watches both halves and rebuilds into `dist/` on change.

## Build

```bash
pnpm --filter vizz-figma-map build
```

Produces `dist/manifest.json`, `dist/code.js`, `dist/ui.html`.

## Import into Figma

1. Open Figma desktop.
2. `Plugins → Development → Import plugin from manifest…`
3. Select `packages/vizz-figma-map/dist/manifest.json`.
4. Run via `Plugins → Development → Vizz Map`.

Figma desktop hot-reloads the plugin when `dist/` changes, so `pnpm dev` gives a tight inner loop.
