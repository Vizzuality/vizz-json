import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComponentPreview } from '#/components/playground/component-preview'

// Mock $$component descriptors (what @@type resolves to)
function MockPanel({ title }: { title: string }) {
  return <div>{title}</div>
}

function MockStat({ value }: { value: string }) {
  return <div>{value}</div>
}

describe('ComponentPreview', () => {
  it('renders component descriptors via Render', () => {
    const components = [
      { $$component: MockPanel, props: { title: 'Hello' } },
      { $$component: MockStat, props: { value: '42' } },
    ]
    render(<ComponentPreview components={components} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders empty state when components array is empty', () => {
    render(<ComponentPreview components={[]} />)
    expect(screen.getByText(/no components/i)).toBeInTheDocument()
  })

  it('renders empty state when components is null', () => {
    render(<ComponentPreview components={null} />)
    expect(screen.getByText(/no components/i)).toBeInTheDocument()
  })
})
