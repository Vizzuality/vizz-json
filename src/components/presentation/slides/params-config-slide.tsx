import { Slide, SlideCode, SlideHeading, SlideText } from '../slide-parts'

const PARAMS_CONFIG = `"params_config": [
  { "key": "opacity",    "default": 0.8, "min": 0, "max": 1, "step": 0.05 },
  { "key": "visibility", "default": "visible", "options": ["visible", "none"] },
  { "key": "color",      "default": "#2563eb" }
]`

export function ParamsConfigSlide() {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-1 uppercase">
        @@#params.X
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Declaring what&apos;s <span className="text-primary">tuneable</span>
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        Each entry declares a parameter key, its default value, and optional
        constraints. The UI auto-infers the right control — a slider for
        min/max, a dropdown for options, a color picker for hex strings.
      </SlideText>

      <SlideCode value={PARAMS_CONFIG} />

      <div className="mt-6 flex w-full flex-wrap gap-3">
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <p className="mb-1 font-mono text-xs text-muted-foreground">
            opacity
          </p>
          <p className="text-sm text-foreground">Slider 0 – 1</p>
        </div>
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <p className="mb-1 font-mono text-xs text-muted-foreground">
            visibility
          </p>
          <p className="text-sm text-foreground">Dropdown</p>
        </div>
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <p className="mb-1 font-mono text-xs text-muted-foreground">color</p>
          <p className="text-sm text-foreground">Color picker</p>
        </div>
      </div>
    </Slide>
  )
}
