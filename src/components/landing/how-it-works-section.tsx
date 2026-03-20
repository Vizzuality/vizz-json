import { Badge } from '#/components/ui/badge'

const INPUTS = [
  { label: '@@#params.*', sublabel: 'runtime values', y: 30 },
  { label: '@@type:*', sublabel: 'layer classes', y: 100 },
  { label: '@@function:*', sublabel: 'registered fns', y: 170 },
  { label: '@@=[expr]', sublabel: 'JS expressions', y: 240 },
]

const OUTPUTS = [
  { label: 'deck.gl Layers', sublabel: 'native JS objects', y: 50 },
  { label: 'MapLibre Style', sublabel: 'map configuration', y: 140 },
  { label: 'Legend Config', sublabel: 'React components', y: 230 },
]

const HUB = { x: 240, y: 105, width: 130, height: 85, rx: 16 }
const INPUT_X = 8
const INPUT_W = 105
const OUTPUT_X = 460
const OUTPUT_W = 115

function inputPath(inputY: number) {
  const startX = INPUT_X + INPUT_W
  const startY = inputY + 13
  const endX = HUB.x
  const endY = HUB.y + HUB.height / 2
  const cpX = (startX + endX) / 2
  return `M${startX},${startY} Q${cpX},${(startY + endY) / 2} ${endX},${endY}`
}

function outputPath(outputY: number) {
  const startX = HUB.x + HUB.width
  const startY = HUB.y + HUB.height / 2
  const endX = OUTPUT_X
  const endY = outputY + 13
  const cpX = (startX + endX) / 2
  return `M${startX},${startY} Q${cpX},${(startY + endY) / 2} ${endX},${endY}`
}

function AnimatedParticle({
  path,
  duration,
  delay,
  color,
}: {
  readonly path: string
  readonly duration: number
  readonly delay: number
  readonly color: string
}) {
  return (
    <circle r="2" fill={color} filter="url(#particle-glow)">
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
        values="0;0.9;1;0.9;0"
        keyTimes="0;0.2;0.5;0.8;1"
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
  height,
  label,
  sublabel,
  labelColor,
}: {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
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
        height={height}
        rx={7}
        fill="#111"
        stroke="#1a3a1a"
        strokeWidth={1}
      />
      <text
        x={cx}
        y={y + 13}
        fill={labelColor}
        fontSize={9.5}
        fontFamily="monospace"
        textAnchor="middle"
      >
        {label}
      </text>
      <text
        x={cx}
        y={y + 24}
        fill="#6b7280"
        fontSize={7}
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        {sublabel}
      </text>
    </g>
  )
}

function HubDiagram() {
  return (
    <svg
      viewBox="0 0 585 290"
      className="mx-auto w-full max-w-2xl"
      role="img"
      aria-label="Diagram showing how resolveConfig processes @@ prefixes into deck.gl layers, MapLibre styles, and legend configs in a single recursive pass"
    >
      <defs>
        <radialGradient id="hub-glow" cx="50%" cy="50%" r="35%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
        </radialGradient>
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
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeOpacity={0.12}
            />
            <AnimatedParticle
              path={p}
              duration={3}
              delay={i * 0.7}
              color="#4ade80"
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
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeOpacity={0.12}
            />
            <AnimatedParticle
              path={p}
              duration={2.5}
              delay={1.5 + i * 0.5}
              color="#86efac"
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
          height={28}
          label={input.label}
          sublabel={input.sublabel}
          labelColor="#4ade80"
        />
      ))}

      {/* Central hub */}
      <rect
        x={HUB.x}
        y={HUB.y}
        width={HUB.width}
        height={HUB.height}
        rx={HUB.rx}
        fill="#14532d"
        stroke="#22c55e"
        strokeWidth={2}
      />
      <text
        x={HUB.x + HUB.width / 2}
        y={HUB.y + HUB.height / 2 + 6}
        fill="#86efac"
        fontSize={16}
        fontWeight={700}
        textAnchor="middle"
      >
        @@ Resolver
      </text>

      {/* Output nodes */}
      {OUTPUTS.map((output) => (
        <NodeRect
          key={output.label}
          x={OUTPUT_X}
          y={output.y}
          width={OUTPUT_W}
          height={28}
          label={output.label}
          sublabel={output.sublabel}
          labelColor="#86efac"
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
          Every{' '}
          <code className="text-primary">@@</code>{' '}
          prefix is resolved in a single pass — no multi-stage builds, no
          compilation step.
        </p>
      </div>
    </section>
  )
}
