import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { ProfileProvider } from './context/ProfileContext'
import { About } from './pages/About'
import { ApplicationDetail } from './pages/ApplicationDetail'
import { Applications } from './pages/Applications'
import { Assistant } from './pages/Assistant'
import { BecomeMentor } from './pages/BecomeMentor'
import { Contact } from './pages/Contact'
import { Faq } from './pages/Faq'
import { ForgotPassword } from './pages/ForgotPassword'
import { Home } from './pages/Home'
import { HowItWorks } from './pages/HowItWorks'
import { Login } from './pages/Login'
import { MentorDetail } from './pages/MentorDetail'
import { Mentors } from './pages/Mentors'
import { MyMentorship } from './pages/MyMentorship'
import { Privacy, Terms } from './pages/Legal'
import { NotFound } from './pages/NotFound'
import { Onboarding } from './pages/Onboarding'
import { Opportunities } from './pages/Opportunities'
import { OpportunityDetail } from './pages/OpportunityDetail'
import { Profile } from './pages/Profile'
import { Resources } from './pages/Resources'
import { Signup } from './pages/Signup'
import { AdminGuard } from './pages/admin/AdminGuard'
import { OpportunityForm } from './pages/admin/OpportunityForm'
import { ReviewQueue } from './pages/admin/ReviewQueue'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProfileProvider>
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
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="applications" element={<Applications />} />
                <Route path="applications/:id" element={<ApplicationDetail />} />
                <Route path="assistant" element={<Assistant />} />
                <Route path="mentors" element={<Mentors />} />
                <Route path="mentors/:id" element={<MentorDetail />} />
                <Route path="become-mentor" element={<BecomeMentor />} />
                <Route path="my-mentorship" element={<MyMentorship />} />
                <Route path="onboarding" element={<Onboarding />} />
                <Route path="profile" element={<Profile />} />
                <Route path="admin/opportunities" element={<AdminGuard><ReviewQueue /></AdminGuard>} />
                <Route path="admin/opportunities/new" element={<AdminGuard><OpportunityForm /></AdminGuard>} />
                <Route path="admin/opportunities/:id/edit" element={<AdminGuard><OpportunityForm /></AdminGuard>} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ProfileProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
