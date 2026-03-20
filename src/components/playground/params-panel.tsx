import { PanelHeader } from './panel-header'
import { LegendCard } from './legend-card'
import { ParamControl } from './param-control'
import type {
  ExampleMetadata,
  InferredParam,
  LegendConfig,
  ResolvedParams,
} from '#/lib/types'

type ParamsPanelProps = {
  readonly metadata: Pick<ExampleMetadata, 'title' | 'tier'> | null
  readonly paramsConfig: readonly InferredParam[]
  readonly legendConfig: LegendConfig | null
  readonly values: ResolvedParams
  readonly onChange: (key: string, value: unknown) => void
}

const HEADER_KEYS = new Set(['opacity', 'visibility'])

export function ParamsPanel({
  metadata,
  paramsConfig,
  legendConfig,
  values,
  onChange,
}: ParamsPanelProps) {
  const opacityParam = paramsConfig.find((p) => p.key === 'opacity')
  const visibilityParam = paramsConfig.find((p) => p.key === 'visibility')
  const legendParams = paramsConfig.filter(
    (p) => p.group === 'legend' && !HEADER_KEYS.has(p.key),
  )
  const remainingParams = paramsConfig.filter(
    (p) => p.group !== 'legend' && !HEADER_KEYS.has(p.key),
  )

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PanelHeader
        metadata={metadata}
        opacityParam={opacityParam}
        visibilityParam={visibilityParam}
        opacityValue={values.opacity}
        visibilityValue={values.visibility}
        onChange={onChange}
      />
      <div className="flex flex-col gap-3 py-3">
        <LegendCard
          legendConfig={legendConfig}
          legendParams={legendParams}
          values={values}
          onChange={onChange}
        />
        {remainingParams.length > 0 && (
          <div className="flex flex-col gap-3 px-3">
            {remainingParams.map((param) => {
              const currentValue = Object.prototype.hasOwnProperty.call(
                values,
                param.key,
              )
                ? values[param.key]
                : param.value

              return (
                <div key={param.key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {param.key}
                  </label>
                  <ParamControl
                    inferred={param}
                    currentValue={currentValue}
                    onChange={(newValue) => onChange(param.key, newValue)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
