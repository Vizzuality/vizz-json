import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InfoPanel } from '#/components/resolver-components/info-panel'

describe('InfoPanel', () => {
  it('renders title as a heading', () => {
    render(<InfoPanel title="Test Title" description="Test body" />)
    expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument()
  })

  it('renders description text', () => {
    render(<InfoPanel title="Title" description="Some description text" />)
    expect(screen.getByText('Some description text')).toBeInTheDocument()
  })

  it('renders with empty strings without crashing', () => {
    render(<InfoPanel title="" description="" />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })
})
