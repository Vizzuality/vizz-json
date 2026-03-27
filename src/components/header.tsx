import { Link } from '@tanstack/react-router'
import { Github } from 'lucide-react'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import ParaglideLocaleSwitcher from './locale-switcher'
import ThemeToggle from './theme-toggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav aria-label="Main navigation" className="flex h-14 items-center px-6">
        <Link to="/" className="flex items-center gap-1.5 no-underline">
          <span className="font-mono text-sm text-primary">{'{ @@ }'}</span>
          <span className="font-semibold text-foreground">VizzJson</span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/guidelines"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'no-underline',
            )}
          >
            Guidelines
          </Link>
          <Link
            to="/playground"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'no-underline',
            )}
          >
            Playground
          </Link>
          <Link
            to="/presentation"
            search={{ slide: 1 }}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'no-underline',
            )}
          >
            Presentation
          </Link>
          <a
            href="https://github.com/Vizzuality/vizz-json"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon' }),
              'size-8',
            )}
            aria-label="GitHub repository"
          >
            <Github className="size-4" />
          </a>
          <ThemeToggle />
          <div aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
          <ParaglideLocaleSwitcher />
        </div>
      </nav>
    </header>
  )
}
