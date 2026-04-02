import './question.css'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

interface Question {
  id: string
  question_order: number
  question_text: string
  category: string
  options: string[] | { label: string; value: string }[]
}

interface QuestionsProps {
  user: any
  onComplete: (updatedUser: any) => void
}

const stressMap: Record<string, string> = { very_low: 'high', low: 'medium', medium: 'low', high: 'very_low' }
const riskMap:   Record<string, string> = { very_easy: 'low', easy: 'low', medium: 'medium', hard: 'high' }

const normalizeOptions = (options: any): { label: string; value: string }[] =>
  Array.isArray(options)
    ? options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o))
    : []

const isTime   = (cat: string) => cat.toLowerCase().includes('time') || cat.toLowerCase() === 'schedule'
const isNumber = (cat: string) => cat === 'grade'

export default function Questions({ user, onComplete }: QuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent]     = useState(0)
  const [answers, setAnswers]     = useState<Record<string, any>>({})
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  useEffect(() => {
    supabase
      .from('questions')
      .select('*')
      .order('question_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError('Failed to load questions.')
        else setQuestions(data || [])
        setLoading(false)
      })
  }, [])

  const goTo = (next: number, dir: 'forward' | 'back') => {
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => { setCurrent(next); setAnimating(false) }, 280)
  }

  const handleSelect = (value: string) =>
    setAnswers((prev) => ({ ...prev, [questions[current].id]: value }))

  const handleNext = () =>
    current < questions.length - 1 ? goTo(current + 1, 'forward') : handleSubmit()

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)

    const payload: Record<string, any> = { user_id: user.user_id }

    questions.forEach((q) => {
      const value = answers[q.id]
      if (value === undefined) return
      switch (q.category) {
        case 'learning_style':      payload.learning_style      = value; break
        case 'energy_level':        payload.stress_level        = stressMap[value] ?? value; break
        case 'homework_difficulty': payload.procrastination_risk = riskMap[value] ?? value; break
        case 'reminder_tone':       payload.reminder_tone       = value; break
        case 'schedule': {
          const t = value.length === 5 ? `${value}:00` : value
          const text = q.question_text.toLowerCase()
          if (text.includes('home') || text.includes('arrive') || text.includes('гэртээ'))      payload.home_arrival_time = t
          else if (text.includes('study') || text.includes('start') || text.includes('суралц')) payload.study_start_time  = t
          else if (text.includes('sleep') || text.includes('bed')   || text.includes('унт'))    payload.sleep_time        = t
          break
        }
      }
    })

    const { error: err } = await supabase.from('user_profiles').upsert(payload, { onConflict: 'user_id' })
    if (err) { setError('Failed to save your profile. Please try again.'); setSaving(false) }
    else onComplete(user)
  }

  if (loading) return (
    <div className="q-page">
      <div className="q-loader-wrap"><div className="q-spinner" /><p>Loading your setup…</p></div>
    </div>
  )

  if (!questions.length) return (
    <div className="q-page"><div className="q-card"><p>No questions found. Please contact support.</p></div></div>
  )

  const q            = questions[current]
  const opts         = normalizeOptions(q.options)
  const currentAnswer = answers[q.id] ?? ''
  const progress     = ((current + 1) / questions.length) * 100
  const isLast       = current === questions.length - 1
  const canProceed   = currentAnswer !== ''

  return (
    <div className="q-page">
      <div className="q-blob q-blob-1" />
      <div className="q-blob q-blob-2" />

      <div className="q-shell">
        <div className="q-header">
          <span className="q-brand">Student Portal</span>
          <span className="q-step-badge">{current + 1} / {questions.length}</span>
        </div>

        <div className="q-progress-track">
          <div className="q-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className={`q-card ${animating ? (direction === 'forward' ? 'q-slide-out-left' : 'q-slide-out-right') : 'q-slide-in'}`}>
          <div className="q-category-tag">{q.category.replace(/_/g, ' ')}</div>
          <h2 className="q-question">{q.question_text}</h2>

          {opts.length > 0 ? (
            <div className={`q-options ${opts.length > 4 ? 'q-options-grid' : 'q-options-col'}`}>
              {opts.map((opt) => (
                <button
                  key={opt.value}
                  className={`q-option ${currentAnswer === opt.value ? 'q-option-selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  {currentAnswer === opt.value && <span className="q-check">✓</span>}
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="q-input-wrap">
              <input
                type={isTime(q.category) ? 'time' : isNumber(q.category) ? 'number' : 'text'}
                className="q-input"
                placeholder={isNumber(q.category) ? 'Enter a number' : 'Type your answer…'}
                value={currentAnswer}
                onChange={(e) => handleSelect(e.target.value)}
                {...(isNumber(q.category) ? { min: 1, max: 12 } : {})}
              />
            </div>
          )}

          {error && <p className="q-error">{error}</p>}
        </div>

        <div className="q-nav">
          <button className="q-btn-back" onClick={() => goTo(current - 1, 'back')} disabled={current === 0}>← Back</button>
          <button className="q-btn-next" onClick={handleNext} disabled={!canProceed || saving}>
            {saving ? <span className="q-btn-spinner" /> : isLast ? 'Finish setup →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}