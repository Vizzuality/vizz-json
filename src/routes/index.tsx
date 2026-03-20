import { createFileRoute } from '@tanstack/react-router'
import { HeroSection } from '#/components/landing/hero-section'
import { ProblemSection } from '#/components/landing/problem-section'
import { PrefixFamilySection } from '#/components/landing/prefix-family-section'
import { HowItWorksSection } from '#/components/landing/how-it-works-section'
import { ShowcaseSection } from '#/components/landing/showcase-section'
export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="min-h-screen landing-page-bg">
      <div className="landing-blobs" aria-hidden="true">
        <div className="landing-blob" />
        <div className="landing-blob" />
        <div className="landing-blob" />
        <div className="landing-blob" />
      </div>
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
