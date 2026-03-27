import { Slide, SlideCode, SlideHeading, SlideText } from '../slide-parts'

const FUNCTION_CODE = `// functions.ts
function setQueryParams({ url, query }) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    params.set(key, String(value))
  }
  return \`\${url}?\${params}\`
}

export const registeredFunctions = {
  setQueryParams,
}`

const CONVERTER_CODE = `// converter-config.ts
import { registeredFunctions } from './functions'

export function createConverter() {
  return createVizzJson({
    functions: { ...registeredFunctions },
    components: { ChoroplethLegend, BasicLegend },
  })
}`

export function FunctionRegistrySlide() {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-2 uppercase">
        @@function:
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Registering <span className="text-primary">custom</span> functions
      </SlideHeading>
      <SlideText className="mb-6 text-muted-foreground">
        Write a plain function, export it from a registry object, and pass it to
        the converter. Any JSON value matching the function name gets replaced
        with the real callable at resolution time.
      </SlideText>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Define & export
          </p>
          <SlideCode value={FUNCTION_CODE} language="typescript" />
        </div>
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Register in the converter
          </p>
          <SlideCode value={CONVERTER_CODE} language="typescript" />
        </div>
      </div>
    </Slide>
  )
}
