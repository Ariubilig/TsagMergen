import { useState } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/auth/auth'
import Questions from './components/UI/question/question'
import DailyPlanPage from './components/pages/DailyPlanPage'


type View = 'auth' | 'questions' | 'plan'

export default function App() {

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [view, setView] = useState<View>('auth')

  const handleAuthSuccess = async (user: any) => {
    setCurrentUser(user)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.user_id)
      .maybeSingle()
    setView(profile ? 'plan' : 'questions')
  }

  const handleQuestionsComplete = (updatedUser: any) => {
    setCurrentUser(updatedUser)
    setView('plan')
  }

  if (view === 'auth')      return <Auth onAuthSuccess={handleAuthSuccess} />
  if (view === 'questions') return <Questions user={currentUser} onComplete={handleQuestionsComplete} />

  return <DailyPlanPage userId={currentUser?.user_id} />

}