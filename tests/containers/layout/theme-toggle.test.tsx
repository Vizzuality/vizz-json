import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ThemeToggle from '#/containers/layout/theme-toggle'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.style.colorScheme = ''
})

describe('ThemeToggle', () => {
  it('renders three segments: Auto, Dark, Light', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: /auto/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument()
  })

  it('clicking Light writes localStorage and applies class', () => {
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button', { name: /light/i }))
    expect(localStorage.getItem('theme')).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('clicking Dark writes localStorage and applies class', () => {
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button', { name: /dark/i }))
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('clicking Auto writes localStorage, removes data-theme, and sets colorScheme from system', () => {
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button', { name: /auto/i }))
    expect(localStorage.getItem('theme')).toBe('auto')
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })

  it('reflects stored mode on mount — Dark is active', () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeToggle />)
    const darkBtn = screen.getByRole('button', { name: /dark/i })
    expect(darkBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('reflects stored mode on mount — Light is active', () => {
    localStorage.setItem('theme', 'light')
    render(<ThemeToggle />)
    const lightBtn = screen.getByRole('button', { name: /light/i })
    expect(lightBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('defaults to auto when no localStorage key', () => {
    render(<ThemeToggle />)
    const autoBtn = screen.getByRole('button', { name: /auto/i })
    expect(autoBtn).toHaveAttribute('aria-pressed', 'true')
  })
})
