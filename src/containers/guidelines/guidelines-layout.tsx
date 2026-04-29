import { Outlet } from '@tanstack/react-router'
import { GuidelinesSidebar } from './guidelines-sidebar'

export function GuidelinesLayout() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <GuidelinesSidebar />
      <main className="flex-1 overflow-y-auto px-8 py-8 [&_h1]:max-w-prose [&_h2]:max-w-prose [&_p]:max-w-prose">
        <Outlet />
      </main>
    </div>
  )
}
