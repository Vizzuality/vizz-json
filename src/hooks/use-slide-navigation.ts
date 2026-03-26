import { useReducer, useEffect, useCallback, useMemo } from 'react'

type UseSlideNavigationOptions = {
  readonly totalSlides: number
  readonly stepsPerSlide: readonly number[]
  readonly initialSlide?: number
}

type SlideNavigationState = {
  readonly slide: number
  readonly step: number
  readonly progress: number
  readonly goTo: (slide: number) => void
}

type NavigationState = {
  readonly slide: number
  readonly step: number
}

type NavigationAction =
  | {
      readonly type: 'ADVANCE'
      readonly totalSlides: number
      readonly stepsPerSlide: readonly number[]
    }
  | { readonly type: 'RETREAT'; readonly stepsPerSlide: readonly number[] }
  | {
      readonly type: 'GO_TO'
      readonly slide: number
      readonly totalSlides: number
    }

function navigationReducer(
  state: NavigationState,
  action: NavigationAction,
): NavigationState {
  switch (action.type) {
    case 'ADVANCE': {
      const maxStep = action.stepsPerSlide[state.slide] - 1
      if (state.step < maxStep) {
        return { ...state, step: state.step + 1 }
      }
      if (state.slide < action.totalSlides - 1) {
        return { slide: state.slide + 1, step: 0 }
      }
      return state
    }
    case 'RETREAT': {
      if (state.step > 0) {
        return { ...state, step: state.step - 1 }
      }
      if (state.slide > 0) {
        const prevSlide = state.slide - 1
        return { slide: prevSlide, step: action.stepsPerSlide[prevSlide] - 1 }
      }
      return state
    }
    case 'GO_TO': {
      const clamped = Math.max(
        0,
        Math.min(action.slide, action.totalSlides - 1),
      )
      return { slide: clamped, step: 0 }
    }
  }
}

export function useSlideNavigation({
  totalSlides,
  stepsPerSlide,
  initialSlide = 0,
}: UseSlideNavigationOptions): SlideNavigationState {
  const clampedInitial = Math.max(0, Math.min(initialSlide, totalSlides - 1))

  const [state, dispatch] = useReducer(navigationReducer, {
    slide: clampedInitial,
    step: 0,
  })

  const advance = useCallback(() => {
    dispatch({ type: 'ADVANCE', totalSlides, stepsPerSlide })
  }, [totalSlides, stepsPerSlide])

  const retreat = useCallback(() => {
    dispatch({ type: 'RETREAT', stepsPerSlide })
  }, [stepsPerSlide])

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
    () => (totalSlides <= 1 ? 0 : state.slide / (totalSlides - 1)),
    [state.slide, totalSlides],
  )

  return { slide: state.slide, step: state.step, progress, goTo }
}
