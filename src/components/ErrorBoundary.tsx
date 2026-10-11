import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

/** App-wide error boundary — catches render crashes and shows a safe fallback. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-off-white px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-ink mb-2">Kuch ghalat ho gaya</h1>
            <p className="text-muted mb-6">Something went wrong. Please reload the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-teal text-white px-6 py-2.5 rounded-xl font-medium hover:bg-deep-teal transition"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
