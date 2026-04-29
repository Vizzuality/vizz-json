import { createFileRoute } from '@tanstack/react-router'
import { FluidBackground } from '#/containers/landing/fluid-background'
import { HeroSection } from '#/containers/landing/hero-section'
import { ProblemSection } from '#/containers/landing/problem-section'
import { PrefixFamilySection } from '#/containers/landing/prefix-family-section'
import { HowItWorksSection } from '#/containers/landing/how-it-works-section'
import { ShowcaseSection } from '#/containers/landing/showcase-section'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="min-h-screen landing-page-bg">
      <FluidBackground />
      <HeroSection />
      <div className="landing-separator" />
      <ProblemSection />
      <div className="landing-separator" />
      <PrefixFamilySection />
      <div className="landing-separator" />
      <HowItWorksSection />
      <div className="landing-separator" />
      <ShowcaseSection />
    </main>
  )
}
