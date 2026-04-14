import { supabase } from '@/lib/supabase'
import type { OwnerSummary, Note, Interaction, OwnerStatus, NoteType, InteractionType, InteractionOutcome } from '@/types'

export async function getOwners(opts: {
  search?: string; subCommunity?: string; page?: number; pageSize?: number
} = {}): Promise<{ data: OwnerSummary[]; count: number }> {
  const { search = '', subCommunity = '', page = 1, pageSize = 50 } = opts
  const from = (page - 1) * pageSize
  let query = supabase.from('owner_summary').select('*', { count: 'exact' }).order('name', { ascending: true }).range(from, from + pageSize - 1)
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,unit_numbers.cs.{${search}}`)
  if (subCommunity) query = query.contains('sub_communities', [subCommunity])
  const { data, error, count } = await query
  if (error) throw error
  return { data: (data as OwnerSummary[]) ?? [], count: count ?? 0 }
}

export async function getOwnerById(id: string): Promise<OwnerSummary | null> {
  const { data, error } = await supabase.from('owner_summary').select('*').eq('id', id).single()
  if (error) return null
  return data as OwnerSummary
}

export async function getOwnerNotes(ownerId: string): Promise<Note[]> {
  const { data, error } = await supabase.from('notes').select('id, owner_id, note, note_type, created_at, agent_id').eq('owner_id', ownerId).eq('is_deleted', false).order('created_at', { ascending: false })
  if (error) throw error
  return (data as Note[]) ?? []
}

export async function getOwnerInteractions(ownerId: string): Promise<Interaction[]> {
  const { data, error } = await supabase.from('interactions').select('id, owner_id, interaction_type, outcome, created_at, agent_id').eq('owner_id', ownerId).eq('is_deleted', false).order('created_at', { ascending: false })
  if (error) throw error
  return (data as Interaction[]) ?? []
}

export interface AgentLookup {
  id: string
  name: string | null
  role: 'agent' | 'admin' | string | null
  is_active: boolean | null
}

export async function getAgentProfilesByIds(agentIds: string[]): Promise<AgentLookup[]> {
  if (agentIds.length === 0) return []

  const { data, error } = await supabase
    .from('agent_profiles')
    .select('id, name, role, is_active')
    .in('id', agentIds)

  if (error) throw error
  return (data as AgentLookup[]) ?? []
}

export async function getActiveAgents(): Promise<AgentLookup[]> {
  const { data, error } = await supabase
    .from('agent_profiles')
    .select('id, name, role, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return (data as AgentLookup[]) ?? []
}

export async function addNote(ownerId: string, note: string, noteType: NoteType = 'general'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('notes').insert({ owner_id: ownerId, note, note_type: noteType, agent_id: user?.id })
  if (error) throw error
}

export async function logInteraction(ownerId: string, interactionType: InteractionType, outcome: InteractionOutcome | null): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('interactions').insert({ owner_id: ownerId, interaction_type: interactionType, outcome, agent_id: user?.id })
  if (error) throw error
}

export async function updateOwnerStatus(ownerId: string, status: OwnerStatus): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: currentOwner, error: currentOwnerError } = await supabase
    .from('owners')
    .select('status')
    .eq('id', ownerId)
    .single()

  if (currentOwnerError) throw currentOwnerError

  const previousStatus = currentOwner?.status as OwnerStatus | undefined
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('owners')
    .update({ status, updated_at: now })
    .eq('id', ownerId)

  if (error) throw error

  if (previousStatus && previousStatus !== status) {
    const { error: noteError } = await supabase.from('notes').insert({
      owner_id: ownerId,
      note: `Status changed from ${previousStatus} to ${status}`,
      note_type: 'general',
      agent_id: user?.id,
    })
    if (noteError) throw noteError
  }
}

export async function getCallQueue(page = 1, pageSize = 50): Promise<{ data: OwnerSummary[]; count: number }> {
  const from = (page - 1) * pageSize
  const { data, error, count } = await supabase.from('owner_summary').select('*', { count: 'exact' }).not('phone', 'is', null).neq('phone', '').in('status', ['new', 'cold', 'warm']).order('confidence_score', { ascending: false }).range(from, from + pageSize - 1)
  if (error) throw error
  return { data: (data as OwnerSummary[]) ?? [], count: count ?? 0 }
}
