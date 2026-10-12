import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select, TextArea, TextInput } from '../../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface Snippet {
  id: string
  title: string
  language: string
  code: string
  notes: string
}

const memSnippets: (Snippet & { user_id: string })[] = []

const STARTER_SNIPPETS: Omit<Snippet, 'id'>[] = [
  {
    title: 'Python: Read file line by line',
    language: 'python',
    code: 'with open("data.txt") as f:\n    for line in f:\n        print(line.strip())',
    notes: 'Memory-efficient — never loads the whole file.',
  },
  {
    title: 'JavaScript: Fetch API example',
    language: 'javascript',
    code: 'const res = await fetch("https://api.example.com/data");\nconst data = await res.json();\nconsole.log(data);',
    notes: 'Always wrap in try/catch for real apps.',
  },
  {
    title: 'Python: List comprehension',
    language: 'python',
    code: 'squares = [x**2 for x in range(10) if x % 2 == 0]\nprint(squares)  # [0, 4, 16, 36, 64]',
    notes: 'Faster and cleaner than a for loop.',
  },
  {
    title: 'SQL: Basic join',
    language: 'sql',
    code: 'SELECT u.name, o.total\nFROM users u\nJOIN orders o ON o.user_id = u.id\nWHERE o.total > 100;',
    notes: 'JOIN connects tables on matching keys.',
  },
]

const ERROR_GUIDE: Record<string, string> = {
  'IndexError': 'You\'re accessing a list position that doesn\'t exist. Check: is your loop going one step too far? Remember: a list of length 5 has indexes 0-4.',
  'TypeError': 'You\'re doing an operation on the wrong type — like adding a string to a number. Print the types with type(x) to find the culprit.',
  'SyntaxError': 'Python can\'t even read your code. Check: missing colons (:), unclosed brackets, or bad indentation.',
  'NameError': 'You used a variable that doesn\'t exist (yet). Check spelling, and make sure it\'s defined before this line runs.',
  'KeyError': 'Dictionary key not found. Use dict.get(key) for safe access, or check if the key exists first.',
  'ValueError': 'Right type, wrong value — like int("abc"). Validate your input before converting.',
  'IndentationError': 'Mixed tabs and spaces, or wrong indent level. Use 4 spaces consistently.',
  'AttributeError': 'You called a method that doesn\'t exist on that object. Check the object type — maybe it\'s None?',
}

async function fetchSnippets(userId: string): Promise<Snippet[]> {
  if (!isSupabaseConfigured) return memSnippets.filter((s) => s.user_id === userId)
  const { data } = await supabase.from('user_code_snippets').select('id,title,language,code,notes').eq('user_id', userId).order('created_at', { ascending: false })
  return (data ?? []) as Snippet[]
}

export function CodePlayground() {
  const { user, loading: authLoading } = useAuth()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [active, setActive] = useState<Snippet | null>(null)
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [notes, setNotes] = useState('')
  const [errorQuery, setErrorQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetchSnippets(user.id).then((s) => {
      setSnippets(s)
      setLoading(false)
    })
  }, [user])

  async function handleSave() {
    if (!title.trim() || !code.trim() || !user) return
    if (!isSupabaseConfigured) {
      const s = { id: `mem-${Date.now()}`, user_id: user.id, title: title.trim(), language, code, notes }
      memSnippets.push(s)
      setSnippets((prev) => [s, ...prev])
    } else {
      const { data } = await supabase.from('user_code_snippets').insert({ user_id: user.id, title: title.trim(), language, code, notes }).select('id,title,language,code,notes').single()
      if (data) setSnippets((prev) => [data as Snippet, ...prev])
    }
    setTitle('')
    setCode('')
    setNotes('')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this snippet?')) return
    if (!isSupabaseConfigured) {
      const i = memSnippets.findIndex((s) => s.id === id)
      if (i >= 0) memSnippets.splice(i, 1)
    } else {
      await supabase.from('user_code_snippets').delete().eq('id', id)
    }
    setSnippets((prev) => prev.filter((s) => s.id !== id))
    if (active?.id === id) setActive(null)
  }

  function copyCode(c: string) {
    navigator.clipboard.writeText(c)
  }

  const errorMatch = Object.keys(ERROR_GUIDE).find((k) => errorQuery.toLowerCase().includes(k.toLowerCase()))

  if (authLoading || loading) return <Spinner />
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in for Code Playground" message="Your snippets are saved to your account." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SectionHeading kicker="💻 Code Playground" title="Snippets & debugging" subtitle="Your personal code library + error explainer." />

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          {/* Error explainer */}
          <Card className="p-5 mb-6">
            <h3 className="font-bold mb-3">🐛 Error explainer</h3>
            <TextInput id="err-q" label="Paste your error type" value={errorQuery} onChange={(e) => setErrorQuery(e.target.value)} placeholder="e.g. IndexError: list index out of range" />
            {errorMatch && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="font-semibold text-sm">{errorMatch}</p>
                <p className="text-sm mt-1">{ERROR_GUIDE[errorMatch]}</p>
              </div>
            )}
            {errorQuery && !errorMatch && (
              <p className="text-sm text-muted mt-3">Try the exact error name (e.g. TypeError, SyntaxError). Or ask the AI Assistant!</p>
            )}
          </Card>

          {/* Starter snippets */}
          <h3 className="font-bold mb-3">⭐ Starter snippets</h3>
          <div className="space-y-3">
            {STARTER_SNIPPETS.map((s, i) => (
              <Card key={i} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{s.title}</p>
                    <p className="text-xs text-muted">{s.language} · {s.notes}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyCode(s.code)}>📋 Copy</Button>
                </div>
                <pre className="mt-2 bg-ink text-white text-xs p-3 rounded-lg overflow-x-auto">{s.code}</pre>
              </Card>
            ))}
          </div>
        </div>

        <div>
          {/* My snippets */}
          <Card className="p-5 mb-6">
            <h3 className="font-bold mb-3">+ Save a snippet</h3>
            <TextInput id="snip-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Quick sort" />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Select id="snip-lang" label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="sql">SQL</option>
                <option value="html">HTML/CSS</option>
                <option value="other">Other</option>
              </Select>
              <TextInput id="snip-notes" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What does it do?" />
            </div>
            <div className="mt-3">
              <TextArea id="snip-code" label="Code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your code here…" />
            </div>
            <Button className="mt-3" onClick={handleSave}>Save snippet</Button>
          </Card>

          <h3 className="font-bold mb-3">📚 My snippets ({snippets.length})</h3>
          <div className="space-y-3">
            {snippets.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{s.title}</p>
                    <p className="text-xs text-muted">{s.language}{s.notes ? ` · ${s.notes}` : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => copyCode(s.code)}>📋</Button>
                    <Button size="sm" variant="ghost" onClick={() => setActive(active?.id === s.id ? null : s)}>
                      {active?.id === s.id ? 'Hide' : 'View'}
                    </Button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs text-error px-1">✕</button>
                  </div>
                </div>
                {active?.id === s.id && (
                  <pre className="mt-2 bg-ink text-white text-xs p-3 rounded-lg overflow-x-auto">{s.code}</pre>
                )}
              </Card>
            ))}
            {snippets.length === 0 && <p className="text-sm text-muted text-center py-6">No saved snippets yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
