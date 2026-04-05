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
    let mounted = true

    const resolve = async (u: User | null) => {
      if (!mounted) return
      if (!u) { setUser(null); setView('auth'); return }

      setUser(u)
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', u.id)
          .maybeSingle()

        if (!mounted) return
        if (error) { setView('questions'); return }
        setView(data ? 'plan' : 'questions')
      } catch {
        if (mounted) setView('questions')
      }
    }

    // Use only onAuthStateChange — it fires INITIAL_SESSION on load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { resolve(session?.user ?? null) }
    )

    // Fallback: if onAuthStateChange doesn't fire within 3s, check manually
    const timeout = setTimeout(() => {
      if (mounted && view === 'loading') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          resolve(session?.user ?? null)
        })
      }
    }, 3000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signOut = async () => { await supabase.auth.signOut() }

  return <Ctx.Provider value={{ user, view, setView, signOut }}>{children}</Ctx.Provider>
}
