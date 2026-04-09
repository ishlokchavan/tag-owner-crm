import { supabase } from '@/lib/supabase'
import { DashboardStats, OwnerSummary } from '@/types'

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.from('dashboard_stats').select('*').single()
  if (error) throw error
  return data as DashboardStats
}

export async function getSubCommunityCounts(): Promise<{ name: string; count: number }[]> {
  const { data, error } = await supabase.from('owner_summary').select('sub_communities')
  if (error) throw error
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    for (const sc of row.sub_communities ?? []) { counts[sc] = (counts[sc] ?? 0) + 1 }
  }
  return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
}

export async function getRecentActivity(): Promise<OwnerSummary[]> {
  const { data, error } = await supabase.from('owner_summary').select('*').in('status', ['warm', 'hot', 'contacted']).order('updated_at', { ascending: false }).limit(5)
  if (error) throw error
  return (data as OwnerSummary[]) ?? []
}
