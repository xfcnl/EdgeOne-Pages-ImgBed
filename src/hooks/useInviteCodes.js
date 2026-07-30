import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function useInviteCodes() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCodes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setCodes(data)
    setLoading(false)
    return { data, error }
  }, [])

  useEffect(() => { fetchCodes() }, [fetchCodes])

  const generateCode_ = useCallback(async (expiresInDays) => {
    const { data: { user } } = await supabase.auth.getUser()
    const code = generateCode()
    const expires_at = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
      : null
    const { data, error } = await supabase
      .from('invite_codes')
      .insert({ code, expires_at, created_by: user?.id })
      .select()
      .single()
    if (!error) setCodes(prev => [data, ...prev])
    return { data, error }
  }, [])

  const revokeCode = useCallback(async (id) => {
    const { error } = await supabase
      .from('invite_codes')
      .update({ is_active: false })
      .eq('id', id)
    if (!error) setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: false } : c))
    return { error }
  }, [])

  const markUsed = useCallback(async (codeId, userId) => {
    const { error } = await supabase
      .from('invite_codes')
      .update({ used_by: userId, used_at: new Date().toISOString() })
      .eq('id', codeId)
    return { error }
  }, [])

  const validateCode = useCallback(async (code) => {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .is('used_by', null)
      .single()
    if (error || !data) return { valid: false }
    if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false }
    return { valid: true, id: data.id }
  }, [])

  return { codes, loading, fetchCodes, generateCode: generateCode_, revokeCode, markUsed, validateCode }
}
