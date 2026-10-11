import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { Layout } from './Layout'

describe('Layout', () => {
  it('renders brand and navigation', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(screen.queryByText('Uraan AI')).not.toBeNull()
    expect(screen.queryByText('Home')).not.toBeNull()
    expect(screen.queryAllByText('Log in').length).toBeGreaterThan(0)
  })
})
