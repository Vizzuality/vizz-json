import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CodeBlock } from '#/components/guidelines/code-block'

describe('CodeBlock', () => {
  it('renders JSON content in a pre element', () => {
    const json = { opacity: '@@#params.opacity' }
    render(<CodeBlock value={json} />)
    expect(screen.getByRole('code')).toBeInTheDocument()
    expect(screen.getByText(/"opacity"/)).toBeInTheDocument()
  })

  it('highlights @@#params prefixes with blue styling', () => {
    const json = { opacity: '@@#params.opacity' }
    const { container } = render(<CodeBlock value={json} />)
    const highlighted = container.querySelector('[data-highlight="param-ref"]')
    expect(highlighted).toBeInTheDocument()
    expect(highlighted?.textContent).toContain('@@#params.opacity')
  })

  it('highlights @@function prefixes', () => {
    const json = { '@@function': 'setQueryParams', url: 'https://example.com' }
    const { container } = render(<CodeBlock value={json} />)
    const highlighted = container.querySelector(
      '[data-highlight="function-ref"]',
    )
    expect(highlighted).toBeInTheDocument()
  })

  it('highlights @@type prefixes', () => {
    const json = { '@@type': 'BasicLegend', id: 'test' }
    const { container } = render(<CodeBlock value={json} />)
    const highlighted = container.querySelector('[data-highlight="type-ref"]')
    expect(highlighted).toBeInTheDocument()
  })

  it('highlights @@= expression prefixes', () => {
    const json = { getPosition: '@@=geometry.coordinates' }
    const { container } = render(<CodeBlock value={json} />)
    const highlighted = container.querySelector('[data-highlight="expr-ref"]')
    expect(highlighted).toBeInTheDocument()
  })

  it('renders with optional title', () => {
    render(<CodeBlock value={{ test: true }} title="Example" />)
    expect(screen.getByText('Example')).toBeInTheDocument()
  })
})
