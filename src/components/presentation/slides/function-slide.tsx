import { Slide, SlideCode, SlideHeading, SlideText } from '../slide-parts'

const CONFIG = `{
  "getTileUrl": "@@function:setQueryParams"
}`

export function FunctionSlide() {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-2 uppercase">
        @@function:
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Named function <span className="text-primary">dispatch</span>
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        Reference a registered function by name. The converter looks it up in a
        function registry and injects the callable — perfect for tile URL
        builders, data transforms, or any logic that doesn't belong in JSON.
      </SlideText>

      <SlideCode value={CONFIG} />

      <div className="mt-6 flex w-full flex-col gap-4 md:flex-row md:items-center">
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            registry = {'{ '}
            <span className="font-mono text-chart-2">setQueryParams</span>
            {': '}
            <span className="font-mono text-muted-foreground">
              (url, params) =&gt; ...
            </span>
            {' }'}
          </p>
        </div>
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <p className="font-mono text-sm text-chart-2">ƒ setQueryParams()</p>
        </div>
      </div>
    </Slide>
  )
}
