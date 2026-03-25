import { useSyncExternalStore } from 'react'

function isDark(): boolean {
  if (typeof document === 'undefined') return true
  return document.documentElement.classList.contains('dark')
}

function subscribe(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

function getSnapshot(): boolean {
  return isDark()
}

function getServerSnapshot(): boolean {
  return true
}

export function useResolvedTheme(): 'light' | 'dark' {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return dark ? 'dark' : 'light'
}
