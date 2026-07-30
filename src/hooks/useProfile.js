import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchProfile = async (id) => {
    if (!id) {
      setProfile(null)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('role, is_banned, max_files')
      .eq('id', id)
      .single()
    if (!error) setProfile(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile(userId)
  }, [userId])

  return { profile, loading, refetch: () => fetchProfile(userId) }
}
