import { supabase } from '@/lib/supabase'
import { PropertyDetail, SubCommunity } from '@/types'

export async function getProperties(opts: { search?: string; subCommunity?: string; page?: number; pageSize?: number } = {}): Promise<{ data: PropertyDetail[]; count: number }> {
  const { search = '', subCommunity = '', page = 1, pageSize = 50 } = opts
  const from = (page - 1) * pageSize
  let query = supabase.from('property_detail').select('*', { count: 'exact' }).order('unit_number', { ascending: true }).range(from, from + pageSize - 1)
  if (search) query = query.ilike('unit_number', `%${search}%`)
  if (subCommunity) query = query.eq('sub_community', subCommunity)
  const { data, error, count } = await query
  if (error) throw error
  return { data: (data as PropertyDetail[]) ?? [], count: count ?? 0 }
}

export async function getSubCommunities(): Promise<SubCommunity[]> {
  const { data, error } = await supabase.from('sub_communities').select('*').eq('is_deleted', false).order('name')
  if (error) throw error
  return (data as SubCommunity[]) ?? []
}
