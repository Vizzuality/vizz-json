import { LightbulbIcon, AlertTriangleIcon } from 'lucide-react'

type CalloutProps = {
  readonly variant?: 'tip' | 'warning'
  readonly title: string
  readonly children: React.ReactNode
}

const VARIANTS = {
  tip: {
    icon: LightbulbIcon,
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    iconColor: 'text-blue-400',
  },
  warning: {
    icon: AlertTriangleIcon,
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    iconColor: 'text-amber-400',
  },
} as const

export function Callout({ variant = 'tip', title, children }: CalloutProps) {
  const styles = VARIANTS[variant]
  const Icon = styles.icon

  return (
    <div
      className={`rounded-lg border ${styles.border} ${styles.bg} p-4`}
      role="note"
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${styles.iconColor}`} />
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  )
}
