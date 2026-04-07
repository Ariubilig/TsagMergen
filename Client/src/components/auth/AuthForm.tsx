import './auth.css'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'


type Mode = 'signin' | 'signup'
interface School { id: string; name: string; city: string | null }


export default function AuthForm() {

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [schoolSearch, setSchoolSearch] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [grade, setGrade] = useState('')
  const [classSection, setClassSection] = useState('')
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('schools').select('id, name, city').order('name').then(({ data }) => {
      if (data) setSchools(data)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = schoolSearch.toLowerCase().trim()
    return q ? schools.filter(s => s.name.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q)) : schools
  }, [schools, schoolSearch])

  const switchMode = (m: Mode) => {
    setEmail(''); setPassword(''); setConfirmPassword(''); setUsername('')
    setSchoolSearch(''); setSelectedSchool(null); setGrade(''); setClassSection('')
    setError(null); setMode(m)
  }

  const validate = (): string | null => {
    if (mode === 'signin') return null
    if (password !== confirmPassword) return 'Нууц үг тохирохгүй байна.'
    if (password.length < 6) return 'Нууц үг хамгийн багадаа 6 тэмдэгт.'
    if (!username.trim()) return 'Нэрээ оруулна уу.'
    if (!selectedSchool) return 'Сургуулиа сонгоно уу.'
    if (!grade || +grade < 1 || +grade > 12) return 'Анги 1-12 хооронд байх ёстой.'
    if (!classSection.trim()) return 'Бүлгээ оруулна уу (A, B, C ...).'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true); setError(null)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      // onAuthStateChange in App.tsx handles the rest
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (!data.user) { setError('Бүртгэл амжилтгүй.'); setLoading(false); return }

      const { error: sErr } = await supabase.from('students').insert({
        id: data.user.id,
        username: username.trim(),
        school_id: selectedSchool!.id,
        grade: +grade,
        class_section: classSection.trim().toUpperCase(),
      })
      if (sErr) setError(sErr.message)
      // onAuthStateChange in App.tsx handles navigation
    }
    setLoading(false)
  }

  const selectSchool = (s: School) => {
    setSelectedSchool(s); setSchoolSearch(s.name); setShowDropdown(false)
  }

  return (

    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-app-title">Цагмэргэн</h1>
        <p className="auth-app-sub">{mode === 'signin' ? 'Нэвтрэх' : 'Шинэ бүртгэл үүсгэх'}</p>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'signin' ? 'auth-tab-active' : ''}`} onClick={() => switchMode('signin')}>Нэвтрэх</button>
          <button className={`auth-tab ${mode === 'signup' ? 'auth-tab-active' : ''}`} onClick={() => switchMode('signup')}>Бүртгүүлэх</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Имэйл</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" required className="auth-input" />
          </div>

          <div className="auth-field">
            <label className="auth-label">Нууц үг</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Нууц үгээ оруулна уу" required className="auth-input" />
          </div>

          {mode === 'signup' && <>
            <div className="auth-field">
              <label className="auth-label">Нууц үг давтах</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Дахин нууц үгээ оруулна уу" required className="auth-input" />
            </div>

            <div className="auth-field">
              <label className="auth-label">Нэр</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Таны нэр" required className="auth-input" />
            </div>

            <div className="auth-field auth-school-field">
              <label className="auth-label">Сургууль</label>
              <input
                type="text" value={schoolSearch} autoComplete="off" required className="auth-input" placeholder="Сургуулиа хайх..."
                onFocus={() => setShowDropdown(true)}
                onChange={e => { setSchoolSearch(e.target.value); setSelectedSchool(null); setShowDropdown(true) }}
              />
              {showDropdown && filtered.length > 0 && (
                <div className="auth-dropdown">
                  {filtered.map(s => (
                    <button key={s.id} type="button" className={`auth-dropdown-item ${selectedSchool?.id === s.id ? 'auth-dropdown-selected' : ''}`} onClick={() => selectSchool(s)}>
                      <span className="auth-school-name">{s.name}</span>
                      {s.city && <span className="auth-school-city">{s.city}</span>}
                    </button>
                  ))}
                </div>
              )}
              {showDropdown && !filtered.length && schoolSearch.trim() && (
                <div className="auth-dropdown"><div className="auth-dropdown-empty">Сургууль олдсонгүй</div></div>
              )}
            </div>

            <div className="auth-row">
              <div className="auth-field auth-field-half">
                <label className="auth-label">Анги</label>
                <input type="number" min={1} max={12} value={grade} onChange={e => setGrade(e.target.value)} placeholder="1-12" required className="auth-input" />
              </div>
              <div className="auth-field auth-field-half">
                <label className="auth-label">Бүлэг</label>
                <input type="text" value={classSection} onChange={e => setClassSection(e.target.value.toUpperCase())} placeholder="A, B, C..." required maxLength={2} className="auth-input auth-input-uppercase" />
              </div>
            </div>
          </>}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-primary-btn">
            {loading ? <div className="loader" /> : mode === 'signin' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
          </button>
        </form>
      </div>
    </div>
    
  )

}