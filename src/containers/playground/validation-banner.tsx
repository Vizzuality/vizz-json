import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Wand2,
  Layers,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import type { Diagnostic } from '#/lib/validator'

type Props = {
  readonly diagnostics: readonly Diagnostic[]
  readonly onJumpTo: (path: string) => void
  readonly onExtractLiterals: () => void
  readonly onScaffoldLegend: () => void
}

function hasCode(
  diagnostics: readonly Diagnostic[],
  ...codes: readonly Diagnostic['code'][]
): boolean {
  return diagnostics.some((d) => codes.includes(d.code))
}

export function ValidationBanner({
  diagnostics,
  onJumpTo,
  onExtractLiterals,
  onScaffoldLegend,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  if (diagnostics.length === 0) return null

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length
  const warnCount = diagnostics.filter((d) => d.severity === 'warn').length

  const showExtract = hasCode(
    diagnostics,
    'COLOR_LITERAL_IN_PAINT',
    'COLOR_LITERAL_IN_LEGEND',
  )
  const showScaffold = hasCode(
    diagnostics,
    'MISSING_LEGEND_CONFIG',
    'LEGEND_LAYER_MISMATCH',
  )

  return (
    <TooltipProvider>
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex max-h-[40%] flex-col overflow-hidden border-t border-border/60 bg-background/95 backdrop-blur-sm"
        role="region"
        aria-label="Validation diagnostics"
      >
        {/* Summary row — always visible */}
        <div className="flex shrink-0 items-center gap-2 px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {errorCount > 0 && (
              <Badge variant="destructive" size="sm">
                <AlertCircle />
                {errorCount} {errorCount === 1 ? 'error' : 'errors'}
              </Badge>
            )}
            {warnCount > 0 && (
              <Badge
                variant="outline"
                size="sm"
                className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                <AlertTriangle />
                {warnCount} {warnCount === 1 ? 'warning' : 'warnings'}
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-1">
            {showExtract && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={onExtractLiterals}
                      aria-label="Extract literal colors to params"
                    />
                  }
                >
                  <Wand2 />
                </TooltipTrigger>
                <TooltipContent>Extract literal colors → params</TooltipContent>
              </Tooltip>
            )}

            {showScaffold && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={onScaffoldLegend}
                      aria-label="Scaffold legend from layer"
                    />
                  }
                >
                  <Layers />
                </TooltipTrigger>
                <TooltipContent>Scaffold legend from layer</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setExpanded((v) => !v)}
                    aria-label={
                      expanded ? 'Collapse diagnostics' : 'Expand diagnostics'
                    }
                    aria-expanded={expanded}
                  />
                }
              >
                {expanded ? <ChevronDown /> : <ChevronUp />}
              </TooltipTrigger>
              <TooltipContent>
                {expanded ? 'Collapse' : 'Expand'} diagnostics
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Expandable list */}
        {expanded && (
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-border/40">
            <ul className="divide-y divide-border/30">
              {diagnostics.map((d, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 px-3 py-1.5 text-xs hover:bg-muted/50"
                >
                  {d.severity === 'error' ? (
                    <AlertCircle className="mt-0.5 size-3 shrink-0 text-destructive" />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-500" />
                  )}
                  <span className="shrink-0 font-mono text-muted-foreground">
                    {d.code}
                  </span>
                  <span className="min-w-0 flex-1 text-foreground">
                    {d.message}
                  </span>
                  {d.path && (
                    <button
                      type="button"
                      className="shrink-0 cursor-pointer font-mono text-primary underline-offset-2 hover:underline"
                      onClick={() => onJumpTo(d.path)}
                      title={d.path}
                    >
                      {d.path.length > 40 ? `…${d.path.slice(-37)}` : d.path}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
