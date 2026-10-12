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
    description: 'Topic-based practice with instant explanations, scoring, and attempt history.',
    route: '/apps/test-arena',
    status: 'live',
    category: 'Learning',
  },
  {
    id: 'interview-lab',
    name: 'Interview Lab',
    icon: '🎤',
    tagline: 'Mock interview practice',
    description: '10 real interview questions with answer frameworks, tips, and practice tracking.',
    route: '/apps/interview-lab',
    status: 'live',
    category: 'Career',
  },
  {
    id: 'study-planner',
    name: 'Study Planner',
    icon: '📅',
    tagline: 'Plans that actually work',
    description: 'Daily task list with Pomodoro timer. Realistic schedules, real focus.',
    route: '/apps/study-planner',
    status: 'live',
    category: 'Productivity',
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    icon: '🃏',
    tagline: 'Spaced repetition',
    description: 'Create decks and review with SM-2 spaced repetition — remember forever.',
    route: '/apps/flashcards',
    status: 'live',
    category: 'Learning',
  },
  {
    id: 'code-playground',
    name: 'Code Playground',
    icon: '💻',
    tagline: 'Snippets & debugging',
    description: 'Your personal code library, starter snippets, and a Python error explainer.',
    route: '/apps/code-playground',
    status: 'live',
    category: 'Skills',
  },
  {
    id: 'scholarship-tracker',
    name: 'Scholarship Tracker',
    icon: '🎓',
    tagline: 'Application pipeline',
    description: 'Track every application from researching to accepted. Deadlines, documents, status.',
    route: '/apps/scholarship-tracker',
    status: 'live',
    category: 'Career',
  },
  {
    id: 'english-coach',
    name: 'English Coach',
    icon: '🗣️',
    tagline: 'Daily English',
    description: 'Word of the day, vocabulary bank with Urdu meanings, and grammar clinic.',
    route: '/apps/english-coach',
    status: 'live',
    category: 'Language',
  },
  {
    id: 'progress',
    name: 'Progress Dashboard',
    icon: '📊',
    tagline: 'Your journey',
    description: 'All your activity across every mini-app in one beautiful dashboard.',
    route: '/apps/progress',
    status: 'live',
    category: 'Productivity',
  },
]

export function getApp(id: string): MiniApp | undefined {
  return MINI_APPS.find((a) => a.id === id)
}
