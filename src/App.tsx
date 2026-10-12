import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './i18n/LanguageContext'
import { ProfileProvider } from './context/ProfileContext'
import { About } from './pages/About'
import { ApplicationDetail } from './pages/ApplicationDetail'
import { Applications } from './pages/Applications'
import { Assistant } from './pages/Assistant'
import { BecomeMentor } from './pages/BecomeMentor'
import { Contact } from './pages/Contact'
import { CVBuilder } from './pages/apps/CVBuilder'
import { Dashboard } from './pages/Dashboard'
import { DeleteAccount } from './pages/DeleteAccount'
import { Faq } from './pages/Faq'
import { ForgotPassword } from './pages/ForgotPassword'
import { Home } from './pages/Home'
import { HowItWorks } from './pages/HowItWorks'
import { Login } from './pages/Login'
import { MatchedOpportunities } from './pages/MatchedOpportunities'
import { MentorDetail } from './pages/MentorDetail'
import { Mentors } from './pages/Mentors'
import { MyMentorship } from './pages/MyMentorship'
import { Notifications } from './pages/Notifications'
import { NotificationSettings } from './pages/NotificationSettings'
import { NotesStudio } from './pages/apps/NotesStudio'
import { Privacy, Terms } from './pages/Legal'
import { NotFound } from './pages/NotFound'
import { Onboarding } from './pages/Onboarding'
import { Opportunities } from './pages/Opportunities'
import { OpportunityDetail } from './pages/OpportunityDetail'
import { Profile } from './pages/Profile'
import { Resources } from './pages/Resources'
import { Signup } from './pages/Signup'
import { SOPCoach } from './pages/SOPCoach'
import { AdminGuard } from './pages/admin/AdminGuard'

const Analytics = lazy(() => import('./pages/admin/Analytics').then((m) => ({ default: m.Analytics })))
const OpportunityForm = lazy(() => import('./pages/admin/OpportunityForm').then((m) => ({ default: m.OpportunityForm })))
const ResourceManager = lazy(() => import('./pages/admin/ResourceManager').then((m) => ({ default: m.ResourceManager })))
const ReviewQueue = lazy(() => import('./pages/admin/ReviewQueue').then((m) => ({ default: m.ReviewQueue })))

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
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
                <Route path="apps/cv-builder" element={<CVBuilder />} />
                <Route path="apps/notes" element={<NotesStudio />} />
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
                <Route path="notifications" element={<Notifications />} />
                <Route path="notification-settings" element={<NotificationSettings />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="delete-account" element={<DeleteAccount />} />
                <Route path="matched" element={<MatchedOpportunities />} />
                <Route path="sop-coach" element={<SOPCoach />} />
                <Route path="onboarding" element={<Onboarding />} />
                <Route path="profile" element={<Profile />} />
                <Route path="admin/opportunities" element={<Suspense fallback={<div className="p-12 text-center text-muted">Loading…</div>}><AdminGuard><ReviewQueue /></AdminGuard></Suspense>} />
                <Route path="admin/analytics" element={<Suspense fallback={<div className="p-12 text-center text-muted">Loading…</div>}><AdminGuard><Analytics /></AdminGuard></Suspense>} />
                <Route path="admin/opportunities/new" element={<Suspense fallback={<div className="p-12 text-center text-muted">Loading…</div>}><AdminGuard><OpportunityForm /></AdminGuard></Suspense>} />
                <Route path="admin/opportunities/:id/edit" element={<Suspense fallback={<div className="p-12 text-center text-muted">Loading…</div>}><AdminGuard><OpportunityForm /></AdminGuard></Suspense>} />
                <Route path="admin/resources" element={<Suspense fallback={<div className="p-12 text-center text-muted">Loading…</div>}><AdminGuard><ResourceManager /></AdminGuard></Suspense>} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ProfileProvider>
      </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
