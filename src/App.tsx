import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { Faq } from './pages/Faq'
import { Home } from './pages/Home'
import { HowItWorks } from './pages/HowItWorks'
import { Privacy, Terms } from './pages/Legal'
import { NotFound } from './pages/NotFound'
import { Opportunities } from './pages/Opportunities'
import { OpportunityDetail } from './pages/OpportunityDetail'
import { Resources } from './pages/Resources'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="opportunities/:id" element={<OpportunityDetail />} />
            <Route path="resources" element={<Resources />} />
            <Route path="faq" element={<Faq />} />
            <Route path="contact" element={<Contact />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
