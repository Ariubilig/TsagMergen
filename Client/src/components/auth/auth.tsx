import './auth.css'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type Mode = 'signin' | 'signup'

interface Props {
  onAuthSuccess: (user: any) => void
}

export default function Auth({ onAuthSuccess }: Props) {
  const [mode, setMode]                     = useState<Mode>('signin')
  const [userId, setUserId]                 = useState('')
  const [password, setPassword]             = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [signUpSuccess, setSignUpSuccess]   = useState(false)

  const resetForm = () => {
    setUserId('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
  }

  const switchMode = (newMode: Mode) => {
    resetForm()
    setMode(newMode)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('demo_users')
      .select('*')
      .eq('user_id', userId)
      .eq('password', password)
      .maybeSingle()

    if (fetchError) setError('Something went wrong. Please try again.')
    else if (!data)  setError('Invalid user ID or password.')
    else             onAuthSuccess(data)

    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    const { data: existing, error: existingError } = await supabase
      .from('demo_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    if (existing) {
      setError('This user ID is already taken. Please choose another.')
      setLoading(false)
      return
    }

    const { data: classRow, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('grade', 12)
      .eq('class_section', 'A')
      .single()

    if (classError || !classRow) {
      setError('No class found for 12A.')
      setLoading(false)
      return
    }

const { error: insertError } = await supabase
  .from('demo_users')
  .insert([{ user_id: userId, password }])

    if (insertError) {
      setError(insertError.message)
    } else {
      setSignUpSuccess(true)
    }

    setLoading(false)
  }

  if (signUpSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-success-icon">✓</div>
          <h2 className="auth-title">Account created!</h2>
          <p className="auth-subtitle-center">
            Your account <strong>{userId}</strong> has been created successfully.
          </p>
          <button onClick={() => onAuthSuccess({ user_id: userId, password })} className="auth-primary-btn">
            Continue →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-app-title">Цагмэргэн</h1>
        <p className="auth-app-sub">
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'signin' ? 'auth-tab-active' : ''}`} onClick={() => switchMode('signin')}>Нэвтрэх</button>
          <button className={`auth-tab ${mode === 'signup' ? 'auth-tab-active' : ''}`} onClick={() => switchMode('signup')}>Бүртгүүлэх</button>
        </div>

        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">ID дугаар</label>
            <input type="text" value={userId} onChange={e => setUserId(e.target.value)} placeholder="ID дугаараа оруулна уу" required className="auth-input" />
          </div>

          <div className="auth-field">
            <label className="auth-label">Нууц үг</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Нууц үгээ оруулна уу" required className="auth-input" />
          </div>

          {mode === 'signup' && (
            <div className="auth-field">
              <label className="auth-label">Confirm password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Дахин нууц үгээ оруулна уу" required className="auth-input" />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-primary-btn">
            {loading ? <div className="loader" /> : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}