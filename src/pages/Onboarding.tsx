import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select, TextArea, TextInput } from '../components/ui/fields'
import { emptyProfile, useProfile, type StudentProfile } from '../context/ProfileContext'

const LEVELS = ['Matric', 'Intermediate', 'Bachelor', 'Master', 'PhD']
const FIELDS = ['Computer Science', 'Engineering', 'Medicine', 'Business', 'Arts & Humanities', 'Science', 'Other']
const INTERESTS = ['Scholarships', 'Internships', 'AI & Tech', 'Research', 'Study Abroad', 'Career Growth']
const COUNTRIES = ['Germany', 'UK', 'USA', 'Canada', 'Australia', 'Turkey', 'China', 'Malaysia']

function validateStep(step: number, p: StudentProfile): string | null {
  if (step === 0 && !p.education_level) return 'Please select your education level.'
  if (step === 1 && !p.field_of_study) return 'Please select your field of study.'
  if (step === 2 && p.interests.length === 0) return 'Please pick at least one interest.'
  if (step === 3 && !p.full_name.trim()) return 'Please enter your name.'
  return null
}

const stepTitles = ['Education', 'Academic Profile', 'Interests & Goals', 'Review & Finish']

export function Onboarding() {
  const { saveProfile, mockMode } = useProfile()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<StudentProfile>(emptyProfile)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof StudentProfile>(k: K, v: StudentProfile[K]) {
    setProfile((p) => ({ ...p, [k]: v }))
    setError(null)
  }

  function toggle(list: string[], item: string) {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
  }

  async function next() {
    const err = validateStep(step, profile)
    if (err) return setError(err)
    if (step < 3) return setStep(step + 1)
    setSaving(true)
    const { error: saveErr } = await saveProfile({ ...profile, onboarding_done: true })
    setSaving(false)
    if (saveErr) setError(saveErr)
    else navigate('/profile')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-2 mb-8">
        {stepTitles.map((t, i) => (
          <div key={t} className="flex-1">
            <div className={`h-2 rounded-full ${i <= step ? 'bg-primary-teal' : 'bg-soft-blue'}`} />
            <p className={`text-xs mt-1 ${i === step ? 'text-ink font-semibold' : 'text-muted'}`}>{t}</p>
          </div>
        ))}
      </div>

      <Card className="p-8">
        {mockMode && (
          <p className="text-xs bg-warning/10 text-warning font-medium rounded-xl px-4 py-3 mb-5">
            Demo mode — answers save locally; Supabase connect hote hi cloud mein save honge.
          </p>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink">Step 1: Education</h2>
            <Select id="level" label="Education level" value={profile.education_level} onChange={(e) => set('education_level', e.target.value)}>
              <option value="">Select…</option>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </Select>
            <TextInput id="name" label="Full name" placeholder="Ayesha Khan" value={profile.full_name} onChange={(e) => set('full_name', e.target.value)} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink">Step 2: Academic profile</h2>
            <Select id="field" label="Field of study" value={profile.field_of_study} onChange={(e) => set('field_of_study', e.target.value)}>
              <option value="">Select…</option>
              {FIELDS.map((f) => <option key={f}>{f}</option>)}
            </Select>
            <Select id="need" label="Financial situation (optional)" value={profile.financial_need} onChange={(e) => set('financial_need', e.target.value)}>
              <option value="">Prefer not to say</option>
              <option>Need full funding</option>
              <option>Need partial funding</option>
              <option>Can self-fund</option>
            </Select>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink">Step 3: Interests & goals</h2>
            <div>
              <p className="text-sm font-semibold text-ink mb-2">What interests you? (pick any)</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => set('interests', toggle(profile.interests, i))}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      profile.interests.includes(i)
                        ? 'bg-primary-teal text-white border-primary-teal'
                        : 'border-soft-blue text-muted hover:border-primary-teal'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <TextArea id="goals" label="Your goals (optional)" placeholder="I want to do a funded master's in Germany…" value={profile.goals} onChange={(e) => set('goals', e.target.value)} />
            <div>
              <p className="text-sm font-semibold text-ink mb-2">Dream countries (optional)</p>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('preferred_countries', toggle(profile.preferred_countries, c))}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      profile.preferred_countries.includes(c)
                        ? 'bg-primary-teal text-white border-primary-teal'
                        : 'border-soft-blue text-muted hover:border-primary-teal'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink">Step 4: Review</h2>
            <div>
              <label htmlFor="ob-lang" className="block text-sm font-medium text-ink mb-1.5">Preferred language</label>
              <select
                id="ob-lang"
                value={profile.preferred_language}
                onChange={(e) => set('preferred_language', e.target.value as 'en' | 'ur' | 'roman')}
                className="w-full border border-line rounded-lg px-3 py-2.5 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary-teal"
              >
                <option value="en">English</option>
                <option value="ur">اردو (Urdu)</option>
                <option value="roman">Roman Urdu</option>
              </select>
            </div>
            <dl className="text-sm space-y-2">
              {[['Name', profile.full_name], ['Education', profile.education_level], ['Field', profile.field_of_study],
                ['Interests', profile.interests.join(', ') || '—'], ['Countries', profile.preferred_countries.join(', ') || '—'],
                ['Goals', profile.goals || '—']].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <dt className="w-24 shrink-0 text-muted">{k}</dt>
                  <dd className="font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {error && <p className="text-sm text-error mt-4" role="alert">{error}</p>}

        <div className="flex justify-between mt-8">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
            ← Back
          </Button>
          <Button onClick={next} loading={saving}>
            {step === 3 ? 'Finish ✓' : 'Continue →'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
