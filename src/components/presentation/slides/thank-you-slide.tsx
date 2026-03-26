import type { SlideProps } from '../slide-types'

export function ThankYouSlide(_props: SlideProps) {
  return (
    <div className="slide text-center">
      <h1 className="mb-6 text-foreground">Thank you</h1>
      <p
        className="text-muted-foreground"
        style={{ fontSize: 'var(--slide-body)' }}
      >
        Questions?
      </p>
    </div>
  )
}
