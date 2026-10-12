import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextArea, TextInput } from '../../components/ui/fields'
import { EmptyState, SectionHeading, Spinner } from '../../components/ui/states'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface Deck {
  id: string
  title: string
  dueCount?: number
}

interface Flashcard {
  id: string
  deck_id: string
  front: string
  back: string
  ease: number
  interval_days: number
  due_at: string
}

const memDecks: (Deck & { user_id: string })[] = []
const memCards: Flashcard[] = []

async function fetchDecks(userId: string): Promise<Deck[]> {
  if (!isSupabaseConfigured) return memDecks.filter((d) => d.user_id === userId)
  const { data } = await supabase.from('user_flashcard_decks').select('id,title').eq('user_id', userId).order('created_at')
  const decks = (data ?? []) as Deck[]
  for (const d of decks) {
    const { count } = await supabase.from('user_flashcards').select('id', { count: 'exact', head: true }).eq('deck_id', d.id).lte('due_at', new Date().toISOString())
    d.dueCount = count ?? 0
  }
  return decks
}

async function createDeck(userId: string, title: string): Promise<Deck> {
  if (!isSupabaseConfigured) {
    const d = { id: `mem-${Date.now()}`, user_id: userId, title }
    memDecks.push(d)
    return d
  }
  const { data } = await supabase.from('user_flashcard_decks').insert({ user_id: userId, title }).select('id,title').single()
  return data as Deck
}

async function fetchDueCards(deckId: string): Promise<Flashcard[]> {
  if (!isSupabaseConfigured) return memCards.filter((c) => c.deck_id === deckId && new Date(c.due_at) <= new Date())
  const { data } = await supabase.from('user_flashcards').select('*').eq('deck_id', deckId).lte('due_at', new Date().toISOString()).order('due_at').limit(50)
  return (data ?? []) as Flashcard[]
}

async function addCard(deckId: string, front: string, back: string) {
  if (!isSupabaseConfigured) {
    memCards.push({ id: `mem-${Date.now()}`, deck_id: deckId, front, back, ease: 2.5, interval_days: 0, due_at: new Date().toISOString() })
    return
  }
  await supabase.from('user_flashcards').insert({ deck_id: deckId, front, back })
}

/** SM-2 spaced repetition update */
async function gradeCard(card: Flashcard, quality: number) {
  // quality: 0=forgot, 3=hard, 4=good, 5=easy
  let { ease, interval_days } = card
  if (quality < 3) {
    interval_days = 0
  } else {
    if (interval_days === 0) interval_days = 1
    else if (interval_days === 1) interval_days = 6
    else interval_days = Math.round(interval_days * ease)
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
  }
  const due_at = new Date(Date.now() + interval_days * 86400000).toISOString()

  if (!isSupabaseConfigured) {
    const c = memCards.find((x) => x.id === card.id)
    if (c) {
      c.ease = ease
      c.interval_days = interval_days
      c.due_at = due_at
    }
    return
  }
  await supabase.from('user_flashcards').update({ ease, interval_days, due_at }).eq('id', card.id)
}

export function Flashcards() {
  const { user, loading: authLoading } = useAuth()
  const [decks, setDecks] = useState<Deck[]>([])
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null)
  const [dueCards, setDueCards] = useState<Flashcard[]>([])
  const [ci, setCi] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [newDeckTitle, setNewDeckTitle] = useState('')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [mode, setMode] = useState<'list' | 'review' | 'add'>('list')
  const [loading, setLoading] = useState(true)
  const [reviewed, setReviewed] = useState(0)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetchDecks(user.id).then((d) => {
      setDecks(d)
      setLoading(false)
    })
  }, [user])

  async function handleCreateDeck() {
    if (!newDeckTitle.trim() || !user) return
    const d = await createDeck(user.id, newDeckTitle.trim())
    setDecks((prev) => [...prev, { ...d, dueCount: 0 }])
    setNewDeckTitle('')
  }

  async function startReview(deck: Deck) {
    const cards = await fetchDueCards(deck.id)
    setActiveDeck(deck)
    setDueCards(cards)
    setCi(0)
    setShowBack(false)
    setReviewed(0)
    setMode('review')
  }

  async function grade(quality: number) {
    const card = dueCards[ci]
    await gradeCard(card, quality)
    setReviewed((r) => r + 1)
    if (ci + 1 >= dueCards.length) {
      setMode('list')
      if (user) fetchDecks(user.id).then(setDecks)
    } else {
      setCi(ci + 1)
      setShowBack(false)
    }
  }

  async function handleAddCard() {
    if (!front.trim() || !back.trim() || !activeDeck) return
    await addCard(activeDeck.id, front.trim(), back.trim())
    setFront('')
    setBack('')
    if (user) fetchDecks(user.id).then(setDecks)
  }

  if (authLoading || loading) return <Spinner />
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card><EmptyState title="Log in for Flashcards" message="Your decks are saved to your account." action={<Link to="/login"><Button>Log in</Button></Link>} /></Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SectionHeading kicker="🃏 Flashcards" title="Spaced repetition" subtitle="Review at the right time — remember forever." />

      {mode === 'list' && (
        <>
          <Card className="p-5 mb-6">
            <div className="flex gap-2">
              <div className="flex-1">
                <TextInput id="deck-title" label="New deck" value={newDeckTitle} onChange={(e) => setNewDeckTitle(e.target.value)} placeholder="e.g. Biology Chapter 5" />
              </div>
              <div className="pt-7"><Button onClick={handleCreateDeck}>Create</Button></div>
            </div>
          </Card>
          <div className="grid sm:grid-cols-2 gap-4">
            {decks.map((d) => (
              <Card key={d.id} className="p-5">
                <h3 className="font-bold">{d.title}</h3>
                <p className="text-sm text-muted mt-1">{d.dueCount ?? 0} cards due</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => startReview(d)} disabled={(d.dueCount ?? 0) === 0}>
                    Review →
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setActiveDeck(d); setMode('add') }}>+ Cards</Button>
                </div>
              </Card>
            ))}
          </div>
          {decks.length === 0 && (
            <p className="text-center text-muted py-8">No decks yet. Create your first deck above! 🃏</p>
          )}
        </>
      )}

      {mode === 'add' && activeDeck && (
        <Card className="p-6">
          <h3 className="font-bold mb-4">Add cards to "{activeDeck.title}"</h3>
          <TextInput id="card-front" label="Front (question/term)" value={front} onChange={(e) => setFront(e.target.value)} placeholder="What is photosynthesis?" />
          <div className="mt-3">
            <TextArea id="card-back" label="Back (answer)" value={back} onChange={(e) => setBack(e.target.value)} placeholder="The process by which plants…" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddCard}>Add card</Button>
            <Button variant="outline" onClick={() => setMode('list')}>Done</Button>
          </div>
        </Card>
      )}

      {mode === 'review' && (
        <>
          {dueCards.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <p className="font-bold">All caught up!</p>
              <p className="text-sm text-muted">No cards due right now. Come back later!</p>
              <Button className="mt-4" variant="outline" onClick={() => setMode('list')}>Back to decks</Button>
            </Card>
          ) : (
            <Card className="p-8">
              <p className="text-sm text-muted mb-4">Card {ci + 1} of {dueCards.length} · {reviewed} reviewed</p>
              <div className="min-h-32 bg-surface rounded-xl p-6 mb-4">
                <p className="text-xs text-muted mb-2">{showBack ? 'ANSWER' : 'QUESTION'}</p>
                <p className="text-lg font-medium">{showBack ? dueCards[ci].back : dueCards[ci].front}</p>
              </div>
              {!showBack ? (
                <Button onClick={() => setShowBack(true)} className="w-full">Show answer</Button>
              ) : (
                <div>
                  <p className="text-sm text-muted mb-3 text-center">How well did you know it?</p>
                  <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" onClick={() => grade(0)}>😰 Forgot</Button>
                    <Button variant="outline" onClick={() => grade(3)}>😅 Hard</Button>
                    <Button onClick={() => grade(4)}>🙂 Good</Button>
                    <Button variant="outline" onClick={() => grade(5)}>😎 Easy</Button>
                  </div>
                </div>
              )}
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => setMode('list')}>End review</Button>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
