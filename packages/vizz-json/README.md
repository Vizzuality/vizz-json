# @vizzuality/vizz-json

A JSON templating system for geospatial visualization using the `@@` prefix convention. Resolve parameterized JSON configurations into live deck.gl layers, React components, and more.

## Install

```bash
pnpm add @vizzuality/vizz-json
```

## Usage

```ts
import { createVizzJson } from '@vizzuality/vizz-json'

const vizzJson = createVizzJson({
  classes: { ScatterplotLayer },
  functions: { setQueryParams },
  enumerations: { GL: { SRC_ALPHA: 0x0302 } },
})

const resolved = vizzJson.resolve({
  '@@type': 'ScatterplotLayer',
  getPosition: '@@=geometry.coordinates',
  opacity: 0.8,
})
```

### Prefix Convention

| Prefix | Purpose | Example |
|--------|---------|---------|
| `@@type` | Instantiate a class or component | `{ "@@type": "ScatterplotLayer", "opacity": 0.8 }` |
| `@@function` | Call a registered function | `{ "@@function": "setQueryParams", "url": "..." }` |
| `@@=` | Create an accessor function | `"@@=geometry.coordinates"` |
| `@@#` | Resolve an enumeration constant | `"@@#GL.SRC_ALPHA"` |

### React Components

Components registered in `components` return descriptors. Use the `Render` component to render them:

```tsx
import { Render } from '@vizzuality/vizz-json/react'

const resolved = vizzJson.resolve({
  '@@type': 'GradientLegend',
  title: 'Population',
  colors: ['#eff6ff', '#1e3a8a'],
})

<Render value={resolved} />
```

### Custom Handlers

Extend with custom value or key handlers:

```ts
const vizzJson = createVizzJson({}, [
  {
    name: 'env',
    type: 'value',
    test: (v) => v.startsWith('@@env:'),
    resolve: (v) => process.env[v.slice('@@env:'.length)],
  },
])
```

## License

MIT
