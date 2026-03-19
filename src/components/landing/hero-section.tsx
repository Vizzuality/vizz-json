import { Link } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export function HeroSection() {
  return (
    <section className="w-full bg-background py-24 sm:py-32">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <Badge variant="secondary" className="mb-4">
          Vizzuality — Frontend Team
        </Badge>
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          JSON with <span className="text-primary">Superpowers</span>
        </h1>
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          The <code className="font-mono text-primary">@@</code> convention for
          turning static JSON into dynamic, parameterized configurations —
          library-agnostic, CMS-ready, runtime-resolved.
        </p>
        <Link
          to="/playground"
          className={cn(buttonVariants({ size: 'lg' }), 'no-underline')}
        >
          Try the Playground
        </Link>
      </div>
    </section>
  )
}
