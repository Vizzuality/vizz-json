# VizzJson Validator

Pure-TS diagnostic engine for VizzJson snapshots. Returns `Diagnostic[]` — no mutation, no I/O, no DOM, no React.

## Usage

```ts
import { validate } from '#/lib/validator'
import { getFunctionMeta } from '#/lib/converter'

const diags = validate(snapshot, { getFunctionMeta })
```

## Multi-source opacity/visibility key collision

The spec (Q10) requires exact keys `opacity` and `visibility` per source. However, VizzJson enforces global uniqueness of `params_config` keys across all sources in a snapshot. In a multi-source snapshot, two sources cannot both declare `key: 'opacity'` — this would be a collision.

**Validator behaviour:**

- **Single-source snapshots:** enforces exact keys `opacity` and `visibility`.
- **Multi-source snapshots:** for each source `S`, the validator looks for a `ParamConfig` with `source === S.id` AND a key matching the pattern: exact `opacity`, or ending with `_opacity` / `.opacity` (same rule for `visibility`). The `source` field (added in v2) is the mechanism for disambiguation.

**Practical implication for authors:** in multi-source examples, use prefixed keys such as `countries_opacity` + `source: 'countries'` rather than a bare `opacity` key shared across sources. Row 3 (example migration) should update examples 11 and 12 accordingly.

This deviation from the spec-literal is intentional and documented here. The lead should confirm whether Row 3 adopts the `<sourceId>_opacity` naming convention.
