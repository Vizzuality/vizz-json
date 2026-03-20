import { Link } from '@tanstack/react-router'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export function CtaSection() {
  return (
    <section className="w-full landing-bg py-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        <Link
          to="/playground"
          className={cn(buttonVariants({ size: 'xl' }), 'no-underline')}
        >
          Open the Playground
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          Edit JSON. Tweak params. See it resolve live.
        </p>
      </div>
    </section>
  )
}
