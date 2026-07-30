import { supabase } from './supabase'

let seeded = false

export async function seedAdmin() {
  if (seeded) return
  seeded = true

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) return

  const { data, error } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
  })

  if (data?.user) {
    await supabase.rpc('set_admin_if_match', {
      target_user_id: data.user.id,
      admin_email: adminEmail,
    })
    await supabase.auth.signOut()
  }
}
