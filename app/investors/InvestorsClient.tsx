'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { OwnerSummary } from '@/types'
import { getInvestors } from '@/services/investors'
import { SearchBar } from '@/components/ui/SearchBar'
import { LoadingRow } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { initials, confidenceColor, formatPhone, getCallUrl, getWhatsAppUrl } from '@/lib/utils'
import Link from 'next/link'
import { Phone, MessageCircle } from 'lucide-react'
import { OwnerDrawer } from '@/components/owners/OwnerDrawer'

const PAGE_SIZE = 30
type InvestorSortKey = 'name' | 'status' | 'phone' | 'units' | 'confidence'

export function InvestorsClient() {
  const [search, setSearch] = useState('')
  const [investors, setInvestors] = useState<OwnerSummary[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | OwnerSummary['status']>('all')
  const [sortKey, setSortKey] = useState<InvestorSortKey>('units')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async (q: string, p: number, append = false) => {
    if (p === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const result = await getInvestors({ search: q, page: p, pageSize: PAGE_SIZE })
      if (append) setInvestors(prev => [...prev, ...result.data])
      else setInvestors(result.data)
      setCount(result.count)
    } finally { setLoading(false); setLoadingMore(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(1); fetchData(search, 1, false) }, 300)
  }, [search, fetchData])

  const hasMore = investors.length < count
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    const next = page + 1
    setPage(next)
    fetchData(search, next, true)
  }, [loadingMore, hasMore, page, search, fetchData])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore || loading) return
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '400px' }
    )
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, loading, loadMore])

  const displayInvestors = useMemo(() => {
    const filtered = statusFilter === 'all'
      ? investors
      : investors.filter(investor => investor.status === statusFilter)

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'units') return (a.unit_count ?? 0) - (b.unit_count ?? 0)
      if (sortKey === 'confidence') return (a.confidence_score ?? -1) - (b.confidence_score ?? -1)
      if (sortKey === 'phone') return (a.phone ?? '').localeCompare(b.phone ?? '')
      if (sortKey === 'status') return a.status.localeCompare(b.status)
      return (a.name ?? '').localeCompare(b.name ?? '')
    })

    return sortDir === 'asc' ? sorted : sorted.reverse()
  }, [investors, statusFilter, sortKey, sortDir])

  const toggleSort = (key: InvestorSortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(key)
    setSortDir(key === 'units' || key === 'confidence' ? 'desc' : 'asc')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <SearchBar value={search} onChange={setSearch} placeholder="Name or phone…" />
      <div className="px-4 md:px-8 mb-2"><span className="text-xs text-[#555D55]">{count.toLocaleString()} investors</span></div>
      <div className="hidden items-center justify-between gap-3 px-4 pb-3 md:flex md:px-8">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-[#555D55]">Status</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | OwnerSummary['status'])}
            className="rounded-xl border border-[#252825] bg-[#1A1D1A] px-3 py-2 text-sm text-[#E8ECE8] outline-none"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="cold">Cold</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
            <option value="contacted">Contacted</option>
            <option value="not_interested">Not Interested</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <span className="text-xs text-[#555D55]">Sorted by {sortKey} · {sortDir}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 px-4 md:hidden">
        {loading ? Array.from({ length: 8 }).map((_, i) => <LoadingRow key={i} />)
          : investors.length === 0 ? <EmptyState message="No investors found" />
          : displayInvestors.map(inv => (
            <Link key={inv.id} href={`/owners/${inv.id}`} className="bg-[#1A1D1A] border border-[#252825] rounded-2xl p-3.5 active:bg-[#252825] hover:bg-[#252825] transition-colors block">
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#252825] border border-[#2E322E] flex items-center justify-center">
                    <span className="text-sm font-semibold text-[#8A918A]">{initials(inv.name)}</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#C9A84C] rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-[#0D0F0E]">{inv.unit_count}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-medium text-[#E8ECE8] truncate">{inv.name ?? '—'}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="text-xs text-[#555D55] mb-1">{inv.phone ?? 'No phone'}</div>
                  <div className="flex flex-wrap gap-1">
                    {(inv.unit_numbers ?? []).slice(0, 3).map(u => (
                      <span key={u} className="px-1.5 py-0.5 bg-[#252825] rounded text-[10px] text-[#C9A84C] font-medium">{u}</span>
                    ))}
                    {inv.unit_count > 3 && <span className="px-1.5 py-0.5 bg-[#252825] rounded text-[10px] text-[#555D55]">+{inv.unit_count - 3} more</span>}
                  </div>
                  {inv.sub_communities && inv.sub_communities.length > 0 && (
                    <div className="text-[10px] text-[#555D55] mt-1 truncate">{inv.sub_communities.join(' · ')}</div>
                  )}
                  {inv.confidence_score != null && (
                    <span className={`text-[10px] font-medium ${confidenceColor(inv.confidence_score)}`}>{inv.confidence_score}% confidence</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {inv.phone && (
                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = getCallUrl(inv.phone!) }}
                      className="w-8 h-8 bg-[#252825] rounded-xl flex items-center justify-center">
                      <Phone size={13} className="text-[#8A918A]" />
                    </button>
                  )}
                  {(inv.whatsapp || inv.phone) && (
                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(getWhatsAppUrl(inv.whatsapp ?? inv.phone), '_blank', 'noopener,noreferrer') }}
                      className="w-8 h-8 bg-[#0d2318] border border-[#1a4030] rounded-xl flex items-center justify-center">
                      <MessageCircle size={13} className="text-[#4caf7d]" />
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}
      </div>
      <div className="hidden px-4 md:block md:px-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-2">
            {Array.from({ length: 8 }).map((_, i) => <LoadingRow key={i} />)}
          </div>
        ) : investors.length === 0 ? (
          <EmptyState message="No investors found" />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#252825] bg-[#1A1D1A]">
            <div className="grid grid-cols-[minmax(230px,1.4fr)_130px_150px_110px_1fr_96px] gap-4 border-b border-[#252825] bg-[#161816] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#555D55]">
              <button onClick={() => toggleSort('name')} className="text-left">Investor</button>
              <button onClick={() => toggleSort('status')} className="text-left">Status</button>
              <button onClick={() => toggleSort('phone')} className="text-left">Phone</button>
              <button onClick={() => toggleSort('units')} className="text-left">Units</button>
              <span>Portfolio</span>
              <span className="text-right">Actions</span>
            </div>
            <div>
              {displayInvestors.map(inv => (
                <div key={inv.id} className="grid grid-cols-[minmax(230px,1.4fr)_130px_150px_110px_1fr_96px] items-center gap-4 border-b border-[#252825] px-5 py-4 last:border-b-0 hover:bg-[#202320]">
                  <div className="min-w-0">
                    <button onClick={() => setSelectedOwnerId(inv.id)} className="block text-left">
                      <div className="truncate text-sm font-semibold text-[#E8ECE8] hover:text-[#C9A84C]">{inv.name ?? '—'}</div>
                    </button>
                    <div className={`mt-1 text-xs font-medium ${confidenceColor(inv.confidence_score)}`}>
                      {inv.confidence_score != null ? `${inv.confidence_score}% confidence` : 'No confidence score'}
                    </div>
                  </div>
                  <div><StatusBadge status={inv.status} /></div>
                  <div className="truncate text-sm text-[#8A918A]">{formatPhone(inv.phone)}</div>
                  <div className="text-sm font-medium text-[#C9A84C]">{inv.unit_count}</div>
                  <div className="truncate text-sm text-[#8A918A]">
                    {(inv.unit_numbers ?? []).slice(0, 4).join(', ') || '—'}
                    {inv.unit_count > 4 ? '…' : ''}
                  </div>
                  <div className="flex justify-end gap-2">
                    {inv.phone && (
                      <button
                        onClick={() => { window.location.href = getCallUrl(inv.phone!) }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#252825] text-[#8A918A] transition-colors hover:text-[#E8ECE8]"
                      >
                        <Phone size={14} />
                      </button>
                    )}
                    {(inv.whatsapp || inv.phone) && (
                      <button
                        onClick={() => { window.open(getWhatsAppUrl(inv.whatsapp ?? inv.phone), '_blank', 'noopener,noreferrer') }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1a4030] bg-[#0d2318] text-[#4caf7d]"
                      >
                        <MessageCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <OwnerDrawer ownerId={selectedOwnerId} onClose={() => setSelectedOwnerId(null)} />
      {!loading && (
        <div ref={sentinelRef} className="px-4 md:px-8 py-6 flex justify-center">
          {loadingMore && <span className="text-xs text-[#555D55]">Loading more…</span>}
          {!hasMore && investors.length > 0 && (
            <span className="text-xs text-[#555D55]">All {count.toLocaleString()} investors loaded</span>
          )}
        </div>
      )}
    </div>
  )
}
