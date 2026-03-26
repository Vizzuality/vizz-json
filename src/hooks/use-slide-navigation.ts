import { useReducer, useEffect, useCallback, useMemo } from 'react'

type UseSlideNavigationOptions = {
  readonly totalSlides: number
  readonly initialSlide?: number
}

type SlideNavigationState = {
  readonly slide: number
  readonly progress: number
  readonly goTo: (slide: number) => void
}

type NavigationAction =
  | { readonly type: 'ADVANCE'; readonly totalSlides: number }
  | { readonly type: 'RETREAT' }
  | { readonly type: 'GO_TO'; readonly slide: number; readonly totalSlides: number }

function navigationReducer(state: number, action: NavigationAction): number {
  switch (action.type) {
    case 'ADVANCE':
      return state < action.totalSlides - 1 ? state + 1 : state
    case 'RETREAT':
      return state > 0 ? state - 1 : state
    case 'GO_TO':
      return Math.max(0, Math.min(action.slide, action.totalSlides - 1))
  }
}

export function useSlideNavigation({
  totalSlides,
  initialSlide = 0,
}: UseSlideNavigationOptions): SlideNavigationState {
  const clampedInitial = Math.max(0, Math.min(initialSlide, totalSlides - 1))

  const [slide, dispatch] = useReducer(navigationReducer, clampedInitial)

  const advance = useCallback(() => {
    dispatch({ type: 'ADVANCE', totalSlides })
  }, [totalSlides])

  const retreat = useCallback(() => {
    dispatch({ type: 'RETREAT' })
  }, [])

  const goTo = useCallback(
    (targetSlide: number) => {
      dispatch({ type: 'GO_TO', slide: targetSlide, totalSlides })
    },
    [totalSlides],
  )

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        advance()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        retreat()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [advance, retreat])

  const progress = useMemo(
    () => (totalSlides <= 1 ? 0 : slide / (totalSlides - 1)),
    [slide, totalSlides],
  )

  return { slide, progress, goTo }
}
