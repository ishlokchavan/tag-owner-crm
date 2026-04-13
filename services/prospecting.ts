import { supabase } from '@/lib/supabase'
import { OwnerSummary, InteractionOutcome, NoteType } from '@/types'

export interface ProspectRow {
  prospect_id: string
  position: number
  called: boolean
  outcome: string | null
  note: string | null
  prospect_date: string
  // owner fields (matches OwnerSummary)
  id: string
  name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  status: OwnerSummary['status']
  confidence_score: number | null
  unit_count: number
  sub_communities: string[] | null
  unit_numbers: string[] | null
  created_at: string
  updated_at: string
}

/**
 * Ensures today's queue is generated for the current agent, then fetches it.
 * Idempotent — safe to call on every page load.
 */
export async function loadDailyQueue(): Promise<{ data: ProspectRow[]; totalCount: number }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Trigger server-side assignment (no-op if already done today)
  await supabase.rpc('assign_daily_prospects', { p_agent_id: user.id })

  const { data, error, count } = await supabase
    .from('daily_prospect_queue')
    .select('*', { count: 'exact' })
    .eq('agent_id', user.id)
    .order('position', { ascending: true })

  if (error) throw error
  return { data: (data as ProspectRow[]) ?? [], totalCount: count ?? 0 }
}

/**
 * Mark a prospect as called, persist outcome + optional note, log interaction.
 */
export async function completeProspect(
  prospectId: string,
  ownerId: string,
  outcome: InteractionOutcome,
  note?: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const updates: Record<string, unknown> = { called: true, outcome }
  if (note?.trim()) updates.note = note.trim()

  const [, interactionResult] = await Promise.all([
    supabase.from('daily_prospects').update(updates).eq('id', prospectId),
    supabase.from('interactions').insert({
      owner_id: ownerId,
      interaction_type: 'call',
      outcome,
      agent_id: user.id,
    }),
  ])

  if (interactionResult.error) throw interactionResult.error

  if (note?.trim()) {
    await supabase.from('notes').insert({
      owner_id: ownerId,
      note: note.trim(),
      note_type: 'call' as NoteType,
      agent_id: user.id,
    })
  }
}

/**
 * Update owner status from within the prospect card.
 */
export async function updateProspectOwnerStatus(
  ownerId: string,
  status: OwnerSummary['status'],
): Promise<void> {
  const { error } = await supabase
    .from('owners')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ownerId)
  if (error) throw error
}

/**
 * Today's call stats for the current agent.
 */
export async function getTodayStats(): Promise<{ total: number; called: number }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { total: 0, called: 0 }

  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('daily_prospects')
    .select('called')
    .eq('agent_id', user.id)
    .eq('prospect_date', today)

  if (error || !data) return { total: 0, called: 0 }
  return { total: data.length, called: data.filter(r => r.called).length }
}

export interface OutcomeCount { outcome: string; count: number }
export interface DailyCount { date: string; called: number; total: number }

export interface TeamAgentRow {
  agent_id: string
  agent_name: string
  today_total: number
  today_called: number
  week_called: number
  all_called: number
}

export async function getTeamActivity(): Promise<TeamAgentRow[]> {
  const { data, error } = await supabase.rpc('get_team_activity')
  if (error) throw error
  return (data as TeamAgentRow[]) ?? []
}

export interface AgentActivity {
  todayTotal: number
  todayCalled: number
  todayOutcomes: OutcomeCount[]
  weekDays: DailyCount[]
  allTimeCalled: number
}

/**
 * Full activity stats for the current agent.
 */
export async function getAgentActivity(): Promise<AgentActivity> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { todayTotal: 0, todayCalled: 0, todayOutcomes: [], weekDays: [], allTimeCalled: 0 }

  const today = new Date().toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [todayRes, weekRes, allTimeRes] = await Promise.all([
    supabase
      .from('daily_prospects')
      .select('called, outcome')
      .eq('agent_id', user.id)
      .eq('prospect_date', today),
    supabase
      .from('daily_prospects')
      .select('prospect_date, called')
      .eq('agent_id', user.id)
      .gte('prospect_date', sevenDaysAgo)
      .order('prospect_date', { ascending: false }),
    supabase
      .from('daily_prospects')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', user.id)
      .eq('called', true),
  ])

  const todayRows = todayRes.data ?? []
  const todayCalled = todayRows.filter(r => r.called)

  // Outcome breakdown for today
  const outcomeMap = new Map<string, number>()
  todayCalled.forEach(r => {
    if (r.outcome) outcomeMap.set(r.outcome, (outcomeMap.get(r.outcome) ?? 0) + 1)
  })
  const todayOutcomes: OutcomeCount[] = Array.from(outcomeMap.entries())
    .map(([outcome, count]) => ({ outcome, count }))
    .sort((a, b) => b.count - a.count)

  // Last 7 days grouped by date
  const dayMap = new Map<string, { called: number; total: number }>()
  ;(weekRes.data ?? []).forEach(r => {
    const d = r.prospect_date
    const cur = dayMap.get(d) ?? { called: 0, total: 0 }
    dayMap.set(d, { called: cur.called + (r.called ? 1 : 0), total: cur.total + 1 })
  })
  const weekDays: DailyCount[] = Array.from(dayMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => b.date.localeCompare(a.date))

  return {
    todayTotal: todayRows.length,
    todayCalled: todayCalled.length,
    todayOutcomes,
    weekDays,
    allTimeCalled: allTimeRes.count ?? 0,
  }
}
