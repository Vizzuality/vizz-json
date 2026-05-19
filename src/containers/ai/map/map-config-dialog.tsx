import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  BASEMAP_OPTIONS,
  DEFAULT_BASEMAP,
  DEFAULT_MAP_VIEW,
  basemapLabel,
} from '#/lib/ai/types'
import type { BasemapId, RendererControls, RendererId } from '#/lib/ai/types'

type Props = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly value: RendererControls
  readonly onSubmit: (next: RendererControls) => void
}

const RENDERERS: ReadonlyArray<{ id: RendererId; label: string }> = [
  { id: 'maplibre', label: 'MapLibre' },
  { id: 'mapbox', label: 'Mapbox' },
]

export function MapConfigDialog({
  open,
  onOpenChange,
  value,
  onSubmit,
}: Props) {
  const [draft, setDraft] = useState<RendererControls>(value)

  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  const view = draft.mapView ?? DEFAULT_MAP_VIEW

  function updateView(patch: Partial<typeof view>) {
    setDraft((d) => ({
      ...d,
      mapView: { ...(d.mapView ?? DEFAULT_MAP_VIEW), ...patch },
    }))
  }

  function handleApply() {
    onSubmit(draft)
    onOpenChange(false)
  }

  const isMaplibre = draft.renderer === 'maplibre'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Map configuration</DialogTitle>
          <DialogDescription>
            Pick the renderer, initial camera, and basemap.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <section className="grid gap-2">
            <span className="text-xs font-medium">Renderer</span>
            <RadioGroup
              value={draft.renderer}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, renderer: v as RendererId }))
              }
              className="flex flex-wrap gap-4"
            >
              {RENDERERS.map((r) => (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                >
                  <RadioGroupItem value={r.id} />
                  {r.label}
                </label>
              ))}
            </RadioGroup>
          </section>

          {draft.renderer === 'mapbox' && (
            <section className="grid gap-2">
              <label className="grid gap-1 text-xs font-medium">
                Mapbox token (public, runtime only)
                <Input
                  type="password"
                  value={draft.mapboxToken ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, mapboxToken: e.target.value }))
                  }
                  placeholder="pk.…"
                />
              </label>
              <label className="grid gap-1 text-xs font-medium">
                Mapbox style URL
                <Input
                  value={draft.mapboxStyleUrl ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, mapboxStyleUrl: e.target.value }))
                  }
                  placeholder="mapbox://styles/owner/id"
                />
              </label>
            </section>
          )}

          {isMaplibre && (
            <section className="grid gap-2">
              <span className="text-xs font-medium">Basemap</span>
              <Select
                value={draft.basemap ?? DEFAULT_BASEMAP}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, basemap: v as BasemapId }))
                }
              >
                <SelectTrigger>
                  <SelectValue>{(v: BasemapId) => basemapLabel(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BASEMAP_OPTIONS.map((b) => (
                    <SelectItem key={b.id} value={b.id} label={b.label}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
          )}

          <section className="grid gap-2">
            <span className="text-xs font-medium">Initial view</span>
            <div className="grid grid-cols-3 gap-2">
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Longitude
                <Input
                  type="number"
                  step="0.0001"
                  value={view.longitude}
                  onChange={(e) =>
                    updateView({ longitude: Number(e.target.value) })
                  }
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Latitude
                <Input
                  type="number"
                  step="0.0001"
                  value={view.latitude}
                  onChange={(e) =>
                    updateView({ latitude: Number(e.target.value) })
                  }
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Zoom
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={22}
                  value={view.zoom}
                  onChange={(e) => updateView({ zoom: Number(e.target.value) })}
                />
              </label>
            </div>
          </section>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
