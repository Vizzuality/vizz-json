import { createFileRoute } from '@tanstack/react-router'
import { HeroSection } from '#/components/landing/hero-section'
import { ProblemSection } from '#/components/landing/problem-section'
import { PrefixFamilySection } from '#/components/landing/prefix-family-section'
import { HowItWorksSection } from '#/components/landing/how-it-works-section'
import { CtaSection } from '#/components/landing/cta-section'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <ProblemSection />
      <PrefixFamilySection />
      <HowItWorksSection />
      <CtaSection />
    </main>
  )
}
