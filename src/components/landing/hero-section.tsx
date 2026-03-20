import { Link } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

function TransformationPreview() {
  return (
    <div className="mt-16 w-full max-w-4xl mx-auto">
      <div className="rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/50">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          <span className="ml-3 text-[11px] text-muted-foreground/60 font-mono">
            localhost:3000/playground
          </span>
        </div>
        {/* Content: before → after */}
        <div className="grid grid-cols-2 min-h-56 sm:min-h-64">
          {/* Before: JSON with @@ prefixes */}
          <div className="bg-zinc-900 p-4 sm:p-5 font-mono text-[10px] sm:text-xs leading-relaxed overflow-hidden border-r border-border/30">
            <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
              Input
            </div>
            <div className="text-zinc-600">{'{'}</div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;
              <span className="text-blue-400">&quot;type&quot;</span>
              {': '}
              <span className="text-amber-300">&quot;raster&quot;</span>,
            </div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;
              <span className="text-blue-400">&quot;paint&quot;</span>
              {': {'}
            </div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span className="text-blue-400">&quot;raster-opacity&quot;</span>
              {': '}
              <span className="text-emerald-400">
                &quot;@@#params.opacity&quot;
              </span>
            </div>
            <div className="text-zinc-400">&nbsp;&nbsp;{'},'}</div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;
              <span className="text-blue-400">&quot;layout&quot;</span>
              {': {'}
            </div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span className="text-blue-400">&quot;visibility&quot;</span>
              {': '}
              <span className="text-emerald-400">
                &quot;@@#params.visible&quot;
              </span>
            </div>
            <div className="text-zinc-400">&nbsp;&nbsp;{'}'}</div>
            <div className="text-zinc-600">{'}'}</div>
          </div>
          {/* After: resolved output */}
          <div className="bg-zinc-950 p-4 sm:p-5 font-mono text-[10px] sm:text-xs leading-relaxed overflow-hidden relative">
            <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
              Output
            </div>
            <div className="text-zinc-600">{'{'}</div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;
              <span className="text-blue-400">&quot;type&quot;</span>
              {': '}
              <span className="text-amber-300">&quot;raster&quot;</span>,
            </div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;
              <span className="text-blue-400">&quot;paint&quot;</span>
              {': {'}
            </div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span className="text-blue-400">&quot;raster-opacity&quot;</span>
              {': '}
              <span className="text-amber-300">0.75</span>
            </div>
            <div className="text-zinc-400">&nbsp;&nbsp;{'},'}</div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;
              <span className="text-blue-400">&quot;layout&quot;</span>
              {': {'}
            </div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span className="text-blue-400">&quot;visibility&quot;</span>
              {': '}
              <span className="text-amber-300">&quot;visible&quot;</span>
            </div>
            <div className="text-zinc-400">&nbsp;&nbsp;{'}'}</div>
            <div className="text-zinc-600">{'}'}</div>
            {/* Subtle glow to indicate "resolved" */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/[0.03] to-transparent" />
          </div>
        </div>
        {/* Bottom bar: param controls */}
        <div className="flex items-center gap-4 sm:gap-6 px-4 sm:px-5 py-3 border-t border-border/30 bg-zinc-900/80">
          {/* Opacity slider */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] sm:text-[11px] text-zinc-500 font-mono shrink-0">
              opacity
            </span>
            <div className="w-16 sm:w-20 h-1.5 rounded-full bg-zinc-700 relative">
              <div className="absolute left-0 top-0 h-full w-3/4 rounded-full bg-primary" />
              <div className="absolute top-1/2 -translate-y-1/2 left-[75%] -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-primary" />
            </div>
            <span className="text-[10px] sm:text-[11px] text-zinc-500 font-mono">
              0.75
            </span>
          </div>
          {/* Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] text-zinc-500 font-mono shrink-0">
              visible
            </span>
            <div className="w-7 h-4 rounded-full bg-primary relative">
              <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="w-full landing-bg py-24 sm:py-32">
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
          className={cn(buttonVariants({ size: 'xl' }), 'no-underline')}
        >
          Try the Playground
        </Link>
      </div>
      <div className="mx-auto max-w-5xl px-6">
        <TransformationPreview />
      </div>
    </section>
  )
}
