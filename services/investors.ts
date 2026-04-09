import { supabase } from '@/lib/supabase'
import { OwnerSummary } from '@/types'

export async function getInvestors(opts: { search?: string; page?: number; pageSize?: number } = {}): Promise<{ data: OwnerSummary[]; count: number }> {
  const { search = '', page = 1, pageSize = 50 } = opts
  const from = (page - 1) * pageSize
  let query = supabase.from('investor_summary').select('*', { count: 'exact' }).range(from, from + pageSize - 1)
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  const { data, error, count } = await query
  if (error) throw error
  return { data: (data as OwnerSummary[]) ?? [], count: count ?? 0 }
}
