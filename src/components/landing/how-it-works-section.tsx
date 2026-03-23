import { Badge } from '#/components/ui/badge'

const INPUTS = [
  { label: '@@#params.*', sublabel: 'runtime values', y: 48 },
  { label: '@@type:*', sublabel: 'layer classes', y: 136 },
  { label: '@@function:*', sublabel: 'registered fns', y: 224 },
  { label: '@@=[expr]', sublabel: 'JS expressions', y: 312 },
]

const OUTPUTS = [
  { label: 'Layer Instances', sublabel: 'native JS objects', y: 70 },
  { label: 'MapLibre Style', sublabel: 'map configuration', y: 180 },
  { label: 'Legend Config', sublabel: 'React components', y: 290 },
]

const INPUT_X = 10
const INPUT_W = 140
const OUTPUT_X = 550
const OUTPUT_W = 140
const NODE_H = 40

const HUB_CX = 350
const HUB_CY = 200
const OUTER_R = 90
const INNER_R = 72

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    return `${Math.round(cx + r * Math.cos(angle))},${Math.round(cy + r * Math.sin(angle))}`
  }).join(' ')
}

const OUTER_HEX = hexPoints(HUB_CX, HUB_CY, OUTER_R)
const INNER_HEX = hexPoints(HUB_CX, HUB_CY, INNER_R)

const OUTER_VERTICES = Array.from({ length: 6 }, (_, i) => {
  const angle = (Math.PI / 3) * i - Math.PI / 2
  return {
    x: Math.round(HUB_CX + OUTER_R * Math.cos(angle)),
    y: Math.round(HUB_CY + OUTER_R * Math.sin(angle)),
  }
})

// Left/right midpoints of inner hex edges (for path connections)
const HUB_LEFT_X = Math.round(HUB_CX - INNER_R * Math.cos(Math.PI / 6))
const HUB_RIGHT_X = Math.round(HUB_CX + INNER_R * Math.cos(Math.PI / 6))

function inputPath(inputY: number) {
  const startX = INPUT_X + INPUT_W
  const startY = inputY + NODE_H / 2
  const endX = HUB_LEFT_X
  const endY = HUB_CY
  const cpX = (startX + endX) / 2
  return `M${startX},${startY} Q${cpX},${(startY + endY) / 2} ${endX},${endY}`
}

function outputPath(outputY: number) {
  const startX = HUB_RIGHT_X
  const startY = HUB_CY
  const endX = OUTPUT_X
  const endY = outputY + NODE_H / 2
  const cpX = (startX + endX) / 2
  return `M${startX},${startY} Q${cpX},${(startY + endY) / 2} ${endX},${endY}`
}

function AnimatedParticle({
  path,
  duration,
  delay,
  color,
  direction,
}: {
  readonly path: string
  readonly duration: number
  readonly delay: number
  readonly color: string
  readonly direction: 'into-hub' | 'from-hub'
}) {
  // into-hub: visible → gone before outer hex border
  // from-hub: invisible at hub → fades in after outer hex border
  const opacityValues =
    direction === 'into-hub' ? '1;0.8;0.2;0;0' : '0;0;0.2;0.8;1'
  const keyTimes =
    direction === 'into-hub' ? '0;0.2;0.55;0.7;1' : '0;0.3;0.45;0.8;1'

  return (
    <circle r="1.5" fill={color} filter="url(#particle-glow)">
      <animateMotion
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        path={path}
        calcMode="spline"
        keyTimes="0;1"
        keySplines="0.4 0 0.2 1"
      />
      <animate
        attributeName="opacity"
        values={opacityValues}
        keyTimes={keyTimes}
        calcMode="spline"
        keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </circle>
  )
}

function NodeRect({
  x,
  y,
  width,
  label,
  sublabel,
  labelColor,
}: {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly label: string
  readonly sublabel: string
  readonly labelColor: string
}) {
  const cx = x + width / 2
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={NODE_H}
        rx={10}
        fill="var(--diagram-node-bg)"
        stroke="var(--diagram-node-border)"
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={y + 17}
        fill={labelColor}
        fontSize={13}
        fontFamily="monospace"
        textAnchor="middle"
      >
        {label}
      </text>
      <text
        x={cx}
        y={y + 32}
        fill="var(--muted-foreground)"
        fontSize={10}
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        {sublabel}
      </text>
    </g>
  )
}

function HexHub() {
  return (
    <g>
      {/* Outer pulsing ring */}
      <polygon
        points={OUTER_HEX}
        fill="none"
        stroke="var(--diagram-stroke)"
        strokeWidth={1}
      >
        <animate
          attributeName="stroke-opacity"
          values="0.15;0.35;0.15"
          dur="4s"
          repeatCount="indefinite"
        />
      </polygon>

      {/* Vertex accent dots */}
      {OUTER_VERTICES.map((v) => (
        <circle
          key={`${v.x}-${v.y}`}
          cx={v.x}
          cy={v.y}
          r={2.5}
          fill="var(--diagram-stroke)"
          opacity={0.4}
        />
      ))}

      {/* Inner hexagon */}
      <polygon
        points={INNER_HEX}
        fill="var(--diagram-hub)"
        stroke="var(--diagram-stroke)"
        strokeWidth={2}
      />

      {/* @@ symbol */}
      <text
        x={HUB_CX}
        y={HUB_CY - 4}
        fill="var(--diagram-input)"
        fontSize={24}
        fontWeight={800}
        fontFamily="monospace"
        textAnchor="middle"
      >
        @@
      </text>

      {/* Resolver label */}
      <text
        x={HUB_CX}
        y={HUB_CY + 18}
        fill="var(--diagram-output)"
        fontSize={12}
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        Resolver
      </text>
    </g>
  )
}

function HubDiagram() {
  return (
    <svg
      viewBox="0 0 700 400"
      className="mx-auto w-full max-w-3xl"
      role="img"
      aria-label="Diagram showing how resolveConfig processes @@ prefixes into layer instances, MapLibre styles, and legend configs in a single recursive pass"
    >
      <defs>
        <filter id="particle-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Input paths + particles */}
      {INPUTS.map((input, i) => {
        const p = inputPath(input.y)
        return (
          <g key={input.label}>
            <path
              d={p}
              fill="none"
              stroke="var(--diagram-stroke)"
              strokeWidth={2}
              strokeOpacity={0.12}
            />
            <AnimatedParticle
              path={p}
              duration={3}
              delay={i * 0.7}
              color="var(--diagram-input)"
              direction="into-hub"
            />
          </g>
        )
      })}

      {/* Output paths + particles */}
      {OUTPUTS.map((output, i) => {
        const p = outputPath(output.y)
        return (
          <g key={output.label}>
            <path
              d={p}
              fill="none"
              stroke="var(--diagram-stroke)"
              strokeWidth={2}
              strokeOpacity={0.12}
            />
            <AnimatedParticle
              path={p}
              duration={2.5}
              delay={1.5 + i * 0.5}
              color="var(--diagram-output)"
              direction="from-hub"
            />
          </g>
        )
      })}

      {/* Input nodes */}
      {INPUTS.map((input) => (
        <NodeRect
          key={input.label}
          x={INPUT_X}
          y={input.y}
          width={INPUT_W}
          label={input.label}
          sublabel={input.sublabel}
          labelColor="var(--diagram-input)"
        />
      ))}

      {/* Hexagonal hub */}
      <HexHub />

      {/* Output nodes */}
      {OUTPUTS.map((output) => (
        <NodeRect
          key={output.label}
          x={OUTPUT_X}
          y={output.y}
          width={OUTPUT_W}
          label={output.label}
          sublabel={output.sublabel}
          labelColor="var(--diagram-output)"
        />
      ))}
    </svg>
  )
}

export function HowItWorksSection() {
  return (
    <section className="w-full py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Badge variant="secondary" className="mb-3">
          How It Works
        </Badge>
        <h2 className="mb-10 text-3xl font-bold text-foreground">
          A single recursive pass.
        </h2>

        <HubDiagram />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Every <code className="text-primary">@@</code> prefix is resolved in a
          single pass — no multi-stage builds, no compilation step.
        </p>
      </div>
    </section>
  )
}
