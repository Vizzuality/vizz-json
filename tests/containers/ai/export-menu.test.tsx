import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExportMenu } from '#/containers/ai/export-menu'

describe('ExportMenu', () => {
  it('copies JSON to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<ExportMenu schemaJson='{"a":1}' filename="test.json" />)
    fireEvent.click(screen.getByRole('button', { name: /copy/i }))
    expect(writeText).toHaveBeenCalledWith('{"a":1}')
  })

  it('renders both buttons disabled when schemaJson is empty', () => {
    render(<ExportMenu schemaJson="" filename="test.json" />)
    expect(screen.getByRole('button', { name: /copy/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /download/i })).toBeDisabled()
  })
})
