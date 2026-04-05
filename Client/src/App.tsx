import { AuthProvider, useAuth } from './components/auth/AuthProvider'
import Auth from './components/auth/auth'
import Questions from './components/UI/question/question'
import DailyPlanPage from './components/pages/DailyPlanPage'

function AppRoutes() {
  const { user, view, setView, signOut } = useAuth()

  if (view === 'loading')
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ee' }}>
        <p style={{ color: '#7a7268', fontFamily: 'Georgia, serif' }}>Ачааллаж байна…</p>
      </div>
    )

  if (view === 'auth')      return <Auth />
  if (view === 'questions') return <Questions user={{ id: user!.id }} onComplete={() => setView('plan')} />
  return <DailyPlanPage userId={user!.id} onSignOut={signOut} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}