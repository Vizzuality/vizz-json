import { useEffect, useState } from 'react'
import { Sun, Moon, SunMoon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'

type ThemeMode = 'light' | 'dark' | 'auto'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'auto'
  }

  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored
  }

  return 'auto'
}

function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode

  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)

  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }

  document.documentElement.style.colorScheme = resolved
}

const SEGMENTS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: 'auto', label: 'Auto', Icon: SunMoon },
  { mode: 'dark', label: 'Dark', Icon: Moon },
  { mode: 'light', label: 'Light', Icon: Sun },
]

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('auto')

  useEffect(() => {
    const initialMode = getInitialMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
  }, [])

  useEffect(() => {
    if (mode !== 'auto') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')

    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [mode])

  function selectMode(next: ThemeMode) {
    setMode(next)
    applyThemeMode(next)
    window.localStorage.setItem('theme', next)
  }

  return (
    <div
      className="flex items-center rounded-lg border border-border bg-secondary p-0.5"
      role="group"
      aria-label="Theme mode"
    >
      {SEGMENTS.map(({ mode: segMode, label, Icon }) => (
        <Tooltip key={segMode}>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={label}
                aria-pressed={mode === segMode}
                onClick={() => selectMode(segMode)}
                className={cn(
                  'size-7 rounded-md',
                  mode === segMode &&
                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                )}
              />
            }
          >
            <Icon className="size-4" />
          </TooltipTrigger>
          <TooltipContent side="bottom">{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
