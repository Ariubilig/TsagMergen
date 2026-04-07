import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthCtx {
  user: User | null
  loading: boolean
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
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true

    const resolve = async (u: User | null) => {
      if (!mounted) return
      if (!u) {
        setUser(null)
        setLoading(false)
        navigate('/auth', { replace: true })
        return
      }

      setUser(u)
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', u.id)
          .maybeSingle()

        if (!mounted) return
        navigate(data ? '/plan' : '/questions', { replace: true })
      } catch {
        if (mounted) navigate('/questions', { replace: true })
      } finally {
        if (mounted) setLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { resolve(session?.user ?? null) }
    )

    const timeout = setTimeout(() => {
      if (mounted && loading) {
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

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth', { replace: true })
  }

  return <Ctx.Provider value={{ user, loading, signOut }}>{children}</Ctx.Provider>
}