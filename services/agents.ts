import { supabase } from '@/lib/supabase'

export interface AgentProfile {
  id: string
  name: string
  role: 'agent' | 'admin'
  is_active: boolean
  created_at: string
  email?: string
}

export async function getCurrentAgent(): Promise<AgentProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('agent_profiles').select('*').eq('id', user.id).single()
  if (!data) return null
  return { ...data, email: user.email }
}
