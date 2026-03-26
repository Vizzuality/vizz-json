import { useMemo, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PresentationLayout } from '#/components/presentation/presentation-layout'
import { useSlideNavigation } from '#/hooks/use-slide-navigation'
import { SLIDES } from '#/components/presentation/slide-registry'

const searchSchema = z.object({
  slide: z.number().int().min(1).catch(1),
})

export const Route = createFileRoute('/presentation')({
  validateSearch: searchSchema,
  component: PresentationPage,
})

function PresentationPage() {
  const { slide: slideParam } = Route.useSearch()
  const navigate = Route.useNavigate()

  const stepsPerSlide = useMemo(() => SLIDES.map((s) => s.totalSteps), [])

  const { slide, step, progress } = useSlideNavigation({
    totalSlides: SLIDES.length,
    stepsPerSlide,
    initialSlide: slideParam - 1,
  })

  // Sync URL with current slide (1-indexed for humans)
  useEffect(() => {
    const desiredUrlSlide = slide + 1
    if (slideParam !== desiredUrlSlide) {
      navigate({
        search: { slide: desiredUrlSlide },
        replace: true,
      })
    }
  }, [slide, slideParam, navigate])

  const CurrentSlide = SLIDES[slide].component

  return (
    <PresentationLayout
      slide={slide}
      totalSlides={SLIDES.length}
      progress={progress}
    >
      <CurrentSlide step={step} />
    </PresentationLayout>
  )
}
