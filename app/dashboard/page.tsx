import { getDashboardStats, getSubCommunityCounts, getRecentActivity } from '@/services/dashboard'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { OwnerCard } from '@/components/ui/OwnerCard'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const revalidate = 60

export default async function DashboardPage() {
  const [stats, subCounts, recent] = await Promise.all([
    getDashboardStats(),
    getSubCommunityCounts(),
    getRecentActivity(),
  ])

  return (
    <div>
      <PageHeader title="TAG CRM" subtitle="Tilal Al Ghaf Intelligence" />
      <div className="grid grid-cols-2 gap-3 px-4 mb-6">
        <StatCard label="Total Owners" value={stats.total_owners} />
        <StatCard label="With Phone" value={stats.owners_with_phone} />
        <StatCard label="Investors" value={stats.total_investors} accent />
        <StatCard label="Properties" value={stats.total_properties} />
      </div>
      <div className="px-4 mb-6">
        <h2 className="text-sm font-semibold text-[#8A918A] uppercase tracking-wide mb-3">Communities</h2>
        <div className="flex flex-col gap-2">
          {subCounts.map(({ name, count }) => (
            <Link key={name} href={`/owners?sub=${encodeURIComponent(name)}`}
              className="flex items-center justify-between bg-[#1A1D1A] border border-[#252825] rounded-xl px-4 py-3 active:bg-[#252825]">
              <span className="text-sm font-medium text-[#E8ECE8]">{name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#555D55]">{count.toLocaleString()}</span>
                <ChevronRight size={14} className="text-[#555D55]" />
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/call-queue" className="bg-[#C9A84C] text-[#0D0F0E] rounded-2xl p-4 font-semibold text-sm text-center active:opacity-80">
            📞 Start Call Queue
          </Link>
          <Link href="/investors" className="bg-[#1A1D1A] border border-[#252825] rounded-2xl p-4 text-sm text-center text-[#C9A84C] font-medium active:bg-[#252825]">
            📈 View Investors
          </Link>
        </div>
      </div>
      {recent.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#8A918A] uppercase tracking-wide">Active Leads</h2>
            <Link href="/owners" className="text-xs text-[#C9A84C]">See all</Link>
          </div>
          <div className="flex flex-col gap-2">
            {recent.map(owner => <OwnerCard key={owner.id} owner={owner} />)}
          </div>
        </div>
      )}
    </div>
  )
}
