'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { OwnerSummary } from '@/types'
import { getInvestors } from '@/services/investors'
import { SearchBar } from '@/components/ui/SearchBar'
import { LoadingRow } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { initials, confidenceColor, getCallUrl, getWhatsAppUrl } from '@/lib/utils'
import Link from 'next/link'
import { Phone, MessageCircle } from 'lucide-react'

const PAGE_SIZE = 30

export function InvestorsClient() {
  const [search, setSearch] = useState('')
  const [investors, setInvestors] = useState<OwnerSummary[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
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

  return (
    <div className="max-w-5xl mx-auto">
      <SearchBar value={search} onChange={setSearch} placeholder="Name or phone…" />
      <div className="px-4 md:px-8 mb-2"><span className="text-xs text-[#555D55]">{count.toLocaleString()} investors</span></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-4 md:px-8">
        {loading ? Array.from({ length: 8 }).map((_, i) => <LoadingRow key={i} />)
          : investors.length === 0 ? <EmptyState message="No investors found" />
          : investors.map(inv => (
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
