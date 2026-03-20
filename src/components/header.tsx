import { Link } from '@tanstack/react-router'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import ParaglideLocaleSwitcher from './locale-switcher'
import ThemeToggle from './theme-toggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav
        aria-label="Main navigation"
        className="flex h-14 items-center px-6"
      >
        <Link to="/" className="flex items-center gap-1.5 no-underline">
          <span className="font-mono text-sm text-primary">{'{ @@ }'}</span>
          <span className="font-semibold text-foreground">Superpowers</span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/playground"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'no-underline',
            )}
          >
            Playground
          </Link>
          <ThemeToggle />
          <div aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
          <ParaglideLocaleSwitcher />
        </div>
      </nav>
    </header>
  )
}
