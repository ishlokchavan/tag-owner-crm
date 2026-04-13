import { getDashboardStats, getSubCommunityCounts, getRecentActivity } from '@/services/dashboard'
import { StatCard } from '@/components/ui/StatCard'
import { OwnerCard } from '@/components/ui/OwnerCard'
import { TopBar } from '@/components/layout/TopBar'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { ChevronRight, Phone, BarChart2 } from 'lucide-react'

export const revalidate = 60

function greeting(): string {
  const hour = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' })).getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('agent_profiles')
    .select('name, role')
    .eq('id', user?.id)
    .single()

  // Resolve display name: profile > user metadata > email local part (never full email)
  const displayName =
    profile?.name ||
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.email ? user.email.split('@')[0] : 'Agent')

  const today = new Date().toISOString().slice(0, 10)
  const { data: todayProspects } = await supabase
    .from('daily_prospects')
    .select('called')
    .eq('agent_id', user?.id)
    .eq('prospect_date', today)

  const totalToday = todayProspects?.length ?? 0
  const calledToday = todayProspects?.filter(r => r.called).length ?? 0
  const hasQueue = totalToday > 0

  const [stats, subCounts, recent] = await Promise.all([
    getDashboardStats(),
    getSubCommunityCounts(),
    getRecentActivity(),
  ])

  return (
    <div className="max-w-5xl mx-auto">
      <TopBar agentName={displayName} agentRole={profile?.role} />

      {/* Greeting */}
      <div className="px-4 md:px-8 pt-5 md:pt-8 pb-4">
        <h1 className="text-xl md:text-2xl font-semibold text-[#E8ECE8] tracking-tight">{greeting()}, {displayName}</h1>
        <p className="text-sm text-[#555D55] mt-0.5">Tilal Al Ghaf · Owner Intelligence</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 md:px-8 mb-6">
        <StatCard label="Total Owners" value={stats.total_owners} />
        <StatCard label="With Phone"   value={stats.owners_with_phone} />
        <StatCard label="Investors"    value={stats.total_investors} accent />
        <StatCard label="Properties"   value={stats.total_properties} />
      </div>

      {/* Main content — 2 col on desktop */}
      <div className="md:grid md:grid-cols-2 md:gap-6 px-4 md:px-8">

        {/* Left col */}
        <div className="flex flex-col gap-5">
          {/* Today's prospecting + activity cards */}
          <div className="flex flex-col gap-2">
            <Link href="/call-queue" className="flex items-center justify-between bg-[#1A1D1A] border border-[#252825] rounded-2xl p-4 hover:bg-[#252825] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                  <Phone size={18} className="text-[#C9A84C]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#E8ECE8]">Daily Prospecting</p>
                  <p className="text-xs text-[#555D55] mt-0.5">
                    {hasQueue
                      ? `${calledToday} of ${totalToday} called today · Elan`
                      : 'Start your queue · Elan'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasQueue && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-[#C9A84C]">{calledToday}/{totalToday}</span>
                    <div className="w-16 h-1 bg-[#252825] rounded-full overflow-hidden">
                      <div className="h-full bg-[#C9A84C] rounded-full"
                        style={{ width: `${totalToday > 0 ? (calledToday / totalToday) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
                <ChevronRight size={16} className="text-[#555D55]" />
              </div>
            </Link>
            <Link href="/activity" className="flex items-center justify-between bg-[#1A1D1A] border border-[#252825] rounded-2xl p-4 hover:bg-[#252825] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#252825] border border-[#2E322E] flex items-center justify-center">
                  <BarChart2 size={18} className="text-[#8A918A]" />
                </div>
                <p className="text-sm font-semibold text-[#E8ECE8]">My Activity</p>
              </div>
              <ChevronRight size={16} className="text-[#555D55]" />
            </Link>
          </div>

          {/* Communities */}
          <div>
            <h2 className="text-xs font-semibold text-[#555D55] uppercase tracking-wide mb-3">Communities</h2>
            <div className="flex flex-col gap-2">
              {subCounts.map(({ name, count }) => (
                <Link key={name} href={`/owners?sub=${encodeURIComponent(name)}`}
                  className="flex items-center justify-between bg-[#1A1D1A] border border-[#252825] rounded-xl px-4 py-3 hover:bg-[#252825] transition-colors">
                  <span className="text-sm font-medium text-[#E8ECE8]">{name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#555D55]">{count.toLocaleString()}</span>
                    <ChevronRight size={14} className="text-[#555D55]" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right col — Active leads */}
        {recent.length > 0 && (
          <div className="mt-5 md:mt-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-[#555D55] uppercase tracking-wide">Active Leads</h2>
              <Link href="/owners" className="text-xs text-[#C9A84C]">See all</Link>
            </div>
            <div className="flex flex-col gap-2">
              {recent.map(owner => <OwnerCard key={owner.id} owner={owner} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
