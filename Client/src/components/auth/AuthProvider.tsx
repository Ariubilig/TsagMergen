import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

type View = 'loading' | 'auth' | 'questions' | 'plan'

interface AuthCtx {
  user: User | null
  view: View
  setView: (v: View) => void
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [view, setView] = useState<View>('loading')

  useEffect(() => {
    const resolve = async (u: User | null) => {
      if (!u) { setUser(null); setView('auth'); return }
      setUser(u)
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', u.id)
        .maybeSingle()
      setView(data ? 'plan' : 'questions')
    }

    supabase.auth.getSession().then(({ data: { session } }) => resolve(session?.user ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => resolve(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => { await supabase.auth.signOut() }

  return <Ctx.Provider value={{ user, view, setView, signOut }}>{children}</Ctx.Provider>
}
