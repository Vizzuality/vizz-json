import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '#/lib/utils'

type NavItem = {
  readonly label: string
  readonly to: string
}

type NavGroup = {
  readonly title: string
  readonly items: readonly NavItem[]
}

const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: 'Getting Started',
    items: [{ label: 'Overview', to: '/guidelines' }],
  },
  {
    title: 'Prefixes',
    items: [
      { label: '@@#params', to: '/guidelines/params' },
      { label: '@@function:', to: '/guidelines/functions' },
      { label: '@@type:', to: '/guidelines/types' },
      { label: '@@=[expr]', to: '/guidelines/expressions' },
      { label: '@@#GL.', to: '/guidelines/gl-constants' },
    ],
  },
  {
    title: 'Configuration',
    items: [{ label: 'Legends', to: '/guidelines/legends' }],
  },
] as const

export function GuidelinesSidebar() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  return (
    <nav
      aria-label="Guidelines navigation"
      className="sticky top-14 h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-border p-4"
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="mb-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive =
                item.to === '/guidelines'
                  ? pathname === '/guidelines' || pathname === '/guidelines/'
                  : pathname.startsWith(item.to)

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      'block rounded-md px-3 py-1.5 text-sm no-underline transition-colors',
                      isActive
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
