import { Routes, Route, Navigate, useNavigate  } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/auth/AuthProvider'
import AuthForm from './components/auth/AuthForm'
import Questions from './components/UI/question/question'
import DailyPlanPage from './components/pages/DailyPlanPage'


function AppRoutes() {


  const { user, view, setView, signOut } = useAuth()
  const navigate = useNavigate()

  if (view === 'loading')
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ee' }}>
        <p style={{ color: '#7a7268', fontFamily: 'Georgia, serif' }}>Ачааллаж байна…</p>
      </div>
    )

  return (

    <Routes>
      <Route path="/auth"      element={!user ? <AuthForm /> : <Navigate to="/plan" replace />} />
      <Route path="/questions" element={user ? <Questions user={{ id: user.id }} onComplete={() => navigate('/plan')} /> : <Navigate to="/auth" replace />} />
      <Route path="/plan"      element={user ? <DailyPlanPage userId={user.id} onSignOut={signOut} /> : <Navigate to="/auth" replace />} />
      <Route path="*"          element={<Navigate to={user ? '/plan' : '/auth'} replace />} />
    </Routes>
    
  )

}

export default function App() {


  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )

}