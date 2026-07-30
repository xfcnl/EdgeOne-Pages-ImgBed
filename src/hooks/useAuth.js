import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const ensureAdmin = useCallback(async (userId, email) => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
    if (userId && email && adminEmail && email === adminEmail) {
      await supabase.rpc('set_admin_if_match', {
        target_user_id: userId,
        admin_email: adminEmail,
      })
    }
  }, [])

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    let { data, error } = await supabase
      .from('profiles')
      .select('role, is_banned, max_files')
      .eq('id', userId)
      .single()
    if (error && (error.code === 'PGRST116' || error.code === '406')) {
      const { error: rpcError } = await supabase.rpc('create_my_profile')
      if (!rpcError) {
        const retry = await supabase
          .from('profiles')
          .select('role, is_banned, max_files')
          .eq('id', userId)
          .single()
        if (!retry.error) data = retry.data
      }
    }
    if (data) setProfile(data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id)
        ensureAdmin(currentUser.id, currentUser.email)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id)
        ensureAdmin(currentUser.id, currentUser.email)
      } else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, ensureAdmin])

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options })
    return { data, error }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(() => {
    if (user) {
      fetchProfile(user.id)
      ensureAdmin(user.id, user.email)
    }
  }, [user, fetchProfile, ensureAdmin])

  return { user, profile, loading, signUp, signIn, signOut, refreshProfile }
}
