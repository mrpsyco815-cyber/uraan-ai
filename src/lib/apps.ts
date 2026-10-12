/**
 * URAAN AI — Mini-App Registry
 * Central registry for all Library mini-apps.
 * Each app: real route, real implementation, honest status.
 */

export interface MiniApp {
  id: string
  name: string
  icon: string
  tagline: string
  description: string
  route: string
  status: 'live' | 'beta' | 'coming'
  category: string
}

export const MINI_APPS: MiniApp[] = [
  {
    id: 'cv-atelier',
    name: 'CV Atelier',
    icon: '📄',
    tagline: 'ATS-friendly CV builder',
    description: 'Build a professional CV with 6 ATS-optimized templates. Live preview, multiple versions, honest guidance — no invented qualifications.',
    route: '/apps/cv-builder',
    status: 'live',
    category: 'Career',
  },
  {
    id: 'notes-studio',
    name: 'Notes Studio',
    icon: '📝',
    tagline: 'Your learning workspace',
    description: 'Write, organize, and search your study notes. Auto-saved, private, searchable — your personal knowledge base.',
    route: '/apps/notes',
    status: 'live',
    category: 'Learning',
  },
  {
    id: 'test-arena',
    name: 'Test Arena',
    icon: '🎯',
    tagline: 'Practice quizzes & tests',
    description: 'Topic-based practice with scoring and weak-topic tracking.',
    route: '/apps/test-arena',
    status: 'coming',
    category: 'Learning',
  },
  {
    id: 'interview-lab',
    name: 'Interview Lab',
    icon: '🎤',
    tagline: 'Mock interview practice',
    description: 'Practice common interview questions with model answers and self-scoring.',
    route: '/apps/interview-lab',
    status: 'coming',
    category: 'Career',
  },
  {
    id: 'study-planner',
    name: 'Study Planner',
    icon: '📅',
    tagline: 'Plans that actually work',
    description: 'Build realistic study schedules with the Pomodoro method and progress tracking.',
    route: '/apps/study-planner',
    status: 'coming',
    category: 'Productivity',
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    icon: '🃏',
    tagline: 'Spaced repetition',
    description: 'Create flashcard decks and review with smart spaced repetition.',
    route: '/apps/flashcards',
    status: 'coming',
    category: 'Learning',
  },
]

export function getApp(id: string): MiniApp | undefined {
  return MINI_APPS.find((a) => a.id === id)
}
