import { Link } from 'react-router-dom'

export function Home() {
  return (
    <section className="bg-gradient-to-b from-deep-teal to-primary-teal text-white">
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Your future shouldn't depend on who you know.
        </h1>
        <p className="text-white/85 text-lg mb-8 max-w-2xl mx-auto">
          Uraan AI helps Pakistani students discover verified scholarships, get AI-powered
          guidance, and connect with real mentors.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/about"
            className="bg-white text-deep-teal px-6 py-3 rounded-xl font-semibold hover:bg-soft-blue transition"
          >
            How it works
          </Link>
          <Link
            to="/login"
            className="border border-white/60 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition"
          >
            Join free
          </Link>
        </div>
      </div>
    </section>
  )
}
