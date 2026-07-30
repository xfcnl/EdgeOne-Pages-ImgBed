import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('settings')
      .select('registration_mode')
      .eq('id', 1)
      .single()
    if (!error) setSettings(data)
    setLoading(false)
    return { data, error }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const updateRegistrationMode = useCallback(async (mode) => {
    const { data, error } = await supabase
      .from('settings')
      .update({ registration_mode: mode, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single()
    if (!error) setSettings(data)
    return { data, error }
  }, [])

  return { settings, loading, fetchSettings, updateRegistrationMode }
}
