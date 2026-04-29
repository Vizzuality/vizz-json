import { Render } from '@vizzuality/vizz-json/react'

type ComponentPreviewProps = {
  readonly components: readonly unknown[] | null
}

export function ComponentPreview({ components }: ComponentPreviewProps) {
  if (!components || components.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">No components resolved</p>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center bg-muted/30 p-8">
      <div className="flex w-full max-w-md flex-col gap-4">
        {components.map((component, i) => (
          <Render key={i} value={component} />
        ))}
      </div>
    </div>
  )
}
