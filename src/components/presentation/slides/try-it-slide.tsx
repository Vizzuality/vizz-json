import { Link } from '@tanstack/react-router'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type { SlideProps } from '../slide-types'

export function TryItSlide(_props: SlideProps) {
  return (
    <div className="slide text-center">
      <h2 className="mb-6 text-foreground">Try it yourself</h2>
      <p className="mb-10 text-muted-foreground">
        Open the playground and experiment with the{' '}
        <code className="text-primary">@@</code> convention live.
      </p>

      <Link
        to="/playground"
        className={cn(
          buttonVariants({ size: 'xl' }),
          'no-underline text-lg px-10 py-6',
        )}
      >
        Open Playground
      </Link>

      <p className="mt-8 text-sm text-muted-foreground/60">/playground</p>
    </div>
  )
}
