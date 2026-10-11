import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { LanguageProvider } from '../i18n/LanguageContext'
import { Layout } from './Layout'

describe('Layout', () => {
  it('renders brand and navigation', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LanguageProvider>
            <Layout />
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(screen.queryByText('Uraan AI')).not.toBeNull()
    expect(screen.queryByText('Home')).not.toBeNull()
    expect(screen.queryAllByText('Log in').length).toBeGreaterThan(0)
  })
})
