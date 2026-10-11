/**
 * SAMPLE DATA ONLY — for design/development. Never treat as real opportunities.
 * Real records come from Supabase (Phase 5) with human verification.
 */
export interface Opportunity {
  id: string
  title: string
  type: 'Scholarship' | 'Fellowship' | 'Internship' | 'Exchange' | 'Course'
  country: string
  level: string
  funding: string
  deadline: string
  status: 'verified' | 'pending' | 'expired'
  summary: string
  sample: true
}

export const sampleOpportunities: Opportunity[] = [
  {
    id: 'sample-1',
    title: 'Sample: HEC Need-Based Scholarship',
    type: 'Scholarship',
    country: 'Pakistan',
    level: 'Undergraduate',
    funding: 'Full tuition',
    deadline: '30 Nov 2026',
    status: 'verified',
    summary: 'Full tuition coverage for undergraduate students in public-sector universities.',
    sample: true,
  },
  {
    id: 'sample-2',
    title: 'Sample: DAAD Scholarship — Germany',
    type: 'Scholarship',
    country: 'Germany',
    level: 'Masters',
    funding: 'Fully funded',
    deadline: '15 Oct 2026',
    status: 'verified',
    summary: 'Postgraduate study in Germany with monthly stipend and travel allowance.',
    sample: true,
  },
  {
    id: 'sample-3',
    title: 'Sample: Chevening Scholarship — UK',
    type: 'Scholarship',
    country: 'UK',
    level: 'Masters',
    funding: 'Fully funded',
    deadline: '5 Nov 2026',
    status: 'pending',
    summary: "One-year master's degrees in the UK for emerging leaders.",
    sample: true,
  },
  {
    id: 'sample-4',
    title: 'Sample: Tech Internship Program',
    type: 'Internship',
    country: 'Remote',
    level: 'Undergraduate',
    funding: 'Stipend',
    deadline: '1 Dec 2025',
    status: 'expired',
    summary: 'Sample expired record to demonstrate the expired state.',
    sample: true,
  },
]
