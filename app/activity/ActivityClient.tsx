'use client'

import { AgentActivity, TeamAgentRow } from '@/services/prospecting'
import { initials } from '@/lib/utils'

const OUTCOME_META: Record<string, { label: string; color: string }> = {
  answered:       { label: 'Answered',       color: 'bg-green-900 border-green-700 text-green-300' },
  interested:     { label: 'Interested',     color: 'bg-amber-900 border-amber-700 text-amber-300' },
  callback:       { label: 'Callback',       color: 'bg-blue-900 border-blue-700 text-blue-300' },
  no_answer:      { label: 'No Answer',      color: 'bg-[#252825] border-[#2E322E] text-[#8A918A]' },
  voicemail:      { label: 'Voicemail',      color: 'bg-[#252825] border-[#2E322E] text-[#8A918A]' },
  not_interested: { label: 'Not Interested', color: 'bg-red-900 border-red-700 text-red-300' },
  wrong_number:   { label: 'Wrong #',        color: 'bg-zinc-800 border-zinc-600 text-zinc-400' },
}

function formatDate(iso: string) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (iso === today) return 'Today'
  if (iso === yesterday) return 'Yesterday'
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

interface Props {
  activity: AgentActivity
  team: TeamAgentRow[]
  isAdmin: boolean
}

export function ActivityClient({ activity, team, isAdmin }: Props) {
  const { todayTotal, todayCalled, todayOutcomes, weekDays, allTimeCalled } = activity
  const pct = todayTotal > 0 ? Math.round((todayCalled / todayTotal) * 100) : 0
  const maxToday = team.length > 0 ? Math.max(...team.map(r => r.today_called), 1) : 1

  return (
    <div className="px-4 md:px-8 pb-8 max-w-5xl mx-auto">
      <div className="md:grid md:grid-cols-2 md:gap-6 flex flex-col gap-5">

      {/* Team leaderboard — admin only */}
      {isAdmin && team.length > 0 && (
        <div className="md:col-span-2">
          <p className="text-xs font-semibold text-[#555D55] uppercase tracking-wide mb-3">Team · Today</p>
          <div className="flex flex-col gap-2">
            {team.map((agent, i) => {
              const agentPct = agent.today_total > 0
                ? Math.round((agent.today_called / agent.today_total) * 100)
                : 0
              const barWidth = agent.today_called > 0
                ? Math.round((agent.today_called / maxToday) * 100)
                : 0
              return (
                <div key={agent.agent_id} className="bg-[#1A1D1A] border border-[#252825] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#252825] flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-[#8A918A]">{initials(agent.agent_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#E8ECE8] truncate">{agent.agent_name ?? '—'}</span>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {i === 0 && agent.today_called > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-[#C9A84C]/20 text-[#C9A84C] rounded font-bold uppercase tracking-wide">Top</span>
                          )}
                          <span className="text-sm text-[#555D55]">
                            <span className="text-[#C9A84C] font-semibold">{agent.today_called}</span>
                            {agent.today_total > 0 && <span> / {agent.today_total}</span>}
                          </span>
                          {agent.today_total > 0 && (
                            <span className="text-xs text-[#555D55]">{agentPct}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-[#252825] rounded-full overflow-hidden">
                    <div className="h-full bg-[#C9A84C] rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }} />
                  </div>
                  <div className="flex gap-3 mt-2 text-[10px] text-[#555D55]">
                    <span>7d: <span className="text-[#8A918A]">{agent.week_called}</span></span>
                    <span>All: <span className="text-[#8A918A]">{agent.all_called.toLocaleString()}</span></span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* My stats — always shown */}
      <div>
        <p className="text-xs font-semibold text-[#555D55] uppercase tracking-wide mb-3">
          {isAdmin ? 'My Stats' : 'Today'}
        </p>

        {/* Today card */}
        <div className="bg-[#1A1D1A] border border-[#252825] rounded-2xl p-5 mb-3">
          <p className="text-xs text-[#555D55] mb-4">Today</p>
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-4xl font-bold text-[#E8ECE8]">{todayCalled}</span>
              <span className="text-lg text-[#555D55] ml-1">/ {todayTotal}</span>
            </div>
            <span className="text-2xl font-semibold text-[#C9A84C]">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-[#252825] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-[#C9A84C] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }} />
          </div>
          {todayOutcomes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {todayOutcomes.map(({ outcome, count }) => {
                const meta = OUTCOME_META[outcome] ?? { label: outcome, color: 'bg-[#252825] border-[#2E322E] text-[#8A918A]' }
                return (
                  <span key={outcome} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${meta.color}`}>
                    {meta.label} <span className="font-bold">{count}</span>
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-[#555D55]">{todayTotal === 0 ? 'No queue assigned yet.' : 'No calls logged yet today.'}</p>
          )}
        </div>

        {/* All-time */}
        <div className="bg-[#1A1D1A] border border-[#252825] rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-[#8A918A]">All-time calls made</p>
          <span className="text-2xl font-bold text-[#E8ECE8]">{allTimeCalled.toLocaleString()}</span>
        </div>
      </div>

      {/* Last 7 days */}
      {weekDays.length > 0 && (
        <div className="md:col-span-1">
          <p className="text-xs font-semibold text-[#555D55] uppercase tracking-wide mb-3">Last 7 Days</p>
          <div className="flex flex-col gap-2">
            {weekDays.map(({ date, called, total }) => {
              const dayPct = total > 0 ? (called / total) * 100 : 0
              return (
                <div key={date} className="bg-[#1A1D1A] border border-[#252825] rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#E8ECE8]">{formatDate(date)}</span>
                    <span className="text-sm text-[#555D55]">
                      <span className="text-[#C9A84C] font-semibold">{called}</span> / {total}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#252825] rounded-full overflow-hidden">
                    <div className="h-full bg-[#C9A84C] rounded-full"
                      style={{ width: `${dayPct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
