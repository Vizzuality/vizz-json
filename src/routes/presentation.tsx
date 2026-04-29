import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PresentationLayout } from '#/containers/presentation/presentation-layout'
import { useSlideNavigation } from '#/hooks/use-slide-navigation'
import { SLIDES } from '#/containers/presentation/slide-registry'

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

  const { slide, progress } = useSlideNavigation({
    totalSlides: SLIDES.length,
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
      <CurrentSlide />
    </PresentationLayout>
  )
}
