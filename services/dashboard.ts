import { supabase } from '@/lib/supabase'
import { DashboardStats, OwnerSummary } from '@/types'

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.from('dashboard_stats').select('*').single()
  if (error) throw error
  return data as DashboardStats
}

export async function getSubCommunityCounts(): Promise<{ name: string; count: number }[]> {
  const { data, error } = await supabase.rpc('get_sub_community_counts')
  if (error) throw error
  return (data as { name: string; count: number }[]) ?? []
}

export async function getRecentActivity(): Promise<OwnerSummary[]> {
  const { data, error } = await supabase.from('owner_summary').select('*').in('status', ['warm', 'hot', 'contacted']).order('updated_at', { ascending: false }).limit(5)
  if (error) throw error
  return (data as OwnerSummary[]) ?? []
}
