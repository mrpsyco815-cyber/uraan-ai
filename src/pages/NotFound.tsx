import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-5xl font-bold text-deep-teal mb-4">404</h1>
      <p className="text-muted mb-6">Ye page nahi mila — this page doesn't exist.</p>
      <Link to="/" className="bg-primary-teal text-white px-6 py-2.5 rounded-xl font-medium">
        Back home
      </Link>
    </div>
  )
}
