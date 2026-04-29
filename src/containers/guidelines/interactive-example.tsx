import { useState, useMemo, useCallback } from 'react'
import type { ParamConfig, ResolvedParams } from '#/lib/types'
import { inferParamControl } from '#/lib/param-inference'
import { resolveConfig } from '#/lib/converter'
import { ParamControl } from '#/containers/playground/param-control'
import { CodeBlock } from './code-block'

type InteractiveExampleProps = {
  readonly title: string
  readonly config: Record<string, unknown>
  readonly paramsConfig: readonly ParamConfig[]
  readonly description?: string
  readonly headerBadge?: string
  readonly children?: (resolved: {
    value: Record<string, unknown> | null
    error: string | null
  }) => React.ReactNode
}

function buildInitialParams(
  paramsConfig: readonly ParamConfig[],
): ResolvedParams {
  const params: Record<string, unknown> = {}
  for (const p of paramsConfig) {
    params[p.key] = p.default
  }
  return params
}

export function InteractiveExample({
  title,
  config,
  paramsConfig,
  description,
  headerBadge,
  children,
}: InteractiveExampleProps) {
  const inferredParams = useMemo(
    () => paramsConfig.map(inferParamControl),
    [paramsConfig],
  )

  const [currentParams, setCurrentParams] = useState<ResolvedParams>(() =>
    buildInitialParams(paramsConfig),
  )

  const handleParamChange = useCallback((key: string, value: unknown) => {
    setCurrentParams((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resolved = useMemo(() => {
    try {
      return { value: resolveConfig(config, currentParams), error: null }
    } catch (err) {
      return {
        value: null,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }, [config, currentParams])

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="text-sm font-medium text-foreground">{title}</span>
        {headerBadge && (
          <span className="ml-auto rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {headerBadge}
          </span>
        )}
      </div>

      {description && (
        <div className="border-b border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
          {description}
        </div>
      )}

      {/* Three-column layout */}
      <div
        className={`grid grid-cols-[2fr_1fr_2fr] divide-x divide-border ${children ? 'border-b border-border' : ''}`}
      >
        {/* Input pane */}
        <div className="p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Input
          </div>
          <CodeBlock value={config} />
        </div>

        {/* Controls pane */}
        <div className="p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Controls
          </div>
          <div className="space-y-4">
            {inferredParams.map((inferred) => (
              <div key={inferred.key}>
                <label className="mb-1 block font-mono text-xs text-muted-foreground">
                  {inferred.key}
                </label>
                <ParamControl
                  inferred={inferred}
                  currentValue={currentParams[inferred.key]}
                  onChange={(value) => handleParamChange(inferred.key, value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Output pane */}
        <div className="p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Output
          </div>
          {resolved.error ? (
            <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">
              {resolved.error}
            </div>
          ) : (
            <div data-testid="output-pane">
              <CodeBlock value={resolved.value ?? {}} />
            </div>
          )}
        </div>
      </div>

      {/* Optional extension slot (used by LiveExample for map preview) */}
      {children?.(resolved)}
    </div>
  )
}
