import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders children and handles disabled state', () => {
    render(<Button disabled>Click me</Button>)
    const btn = screen.getByRole('button', { name: 'Click me' })
    expect(btn).not.toBeNull()
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows loading spinner when loading', () => {
    const { container } = render(<Button loading>Save</Button>)
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })
})
