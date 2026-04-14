'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { OwnerSummary } from '@/types'
import { getOwners } from '@/services/owners'
import { SearchBar } from '@/components/ui/SearchBar'
import { FilterChips } from '@/components/ui/FilterChips'
import { OwnerCard } from '@/components/ui/OwnerCard'
import { LoadingRow } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { confidenceColor, formatPhone, getCallUrl, getWhatsAppUrl } from '@/lib/utils'
import { Phone, MessageCircle } from 'lucide-react'
import { OwnerDrawer } from '@/components/owners/OwnerDrawer'

const PAGE_SIZE = 30
const SCROLL_KEY = 'owners-scroll'
type OwnerSortKey = 'name' | 'status' | 'phone' | 'communities' | 'confidence'

export function OwnersClient({
  subCommunities,
  initialSub,
  initialSearch,
}: {
  subCommunities: string[]
  initialSub: string
  initialSearch: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [sub, setSub] = useState(initialSub)
  const [owners, setOwners] = useState<OwnerSummary[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | OwnerSummary['status']>('all')
  const [sortKey, setSortKey] = useState<OwnerSortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const urlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)

  const fetchOwners = useCallback(async (q: string, sc: string, p: number, append = false) => {
    if (p === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const result = await getOwners({ search: q, subCommunity: sc, page: p, pageSize: PAGE_SIZE })
      if (append) setOwners(prev => [...prev, ...result.data])
      else setOwners(result.data)
      setCount(result.count)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // Debounced fetch on search/filter change
  useEffect(() => {
    if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current)
    fetchDebounceRef.current = setTimeout(() => {
      setPage(1)
      fetchOwners(search, sub, 1, false)
    }, 300)
  }, [search, sub, fetchOwners])

  // Debounced URL sync (slightly longer delay so typing feels smooth)
  useEffect(() => {
    if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current)
    urlDebounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (sub) params.set('sub', sub)
      router.replace(`/owners${params.toString() ? `?${params}` : ''}`, { scroll: false })
    }, 400)
  }, [search, sub, router])

  // Restore scroll position once after initial load completes
  useEffect(() => {
    if (loading) return
    if (!isFirstLoad.current) return
    isFirstLoad.current = false
    const saved = sessionStorage.getItem(SCROLL_KEY)
    if (!saved) return
    sessionStorage.removeItem(SCROLL_KEY)
    requestAnimationFrame(() => {
      window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' as ScrollBehavior })
    })
  }, [loading])

  // Persist scroll position while browsing the list
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Infinite scroll via IntersectionObserver
  const hasMore = owners.length < count

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    const next = page + 1
    setPage(next)
    fetchOwners(search, sub, next, true)
  }, [loadingMore, hasMore, page, search, sub, fetchOwners])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore || loading) return
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '400px' }
    )
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, loading, loadMore])

  const displayOwners = useMemo(() => {
    const filtered = statusFilter === 'all'
      ? owners
      : owners.filter(owner => owner.status === statusFilter)

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'confidence') {
        const left = a.confidence_score ?? -1
        const right = b.confidence_score ?? -1
        return left - right
      }

      if (sortKey === 'communities') {
        return (a.sub_communities?.join(', ') ?? '').localeCompare(b.sub_communities?.join(', ') ?? '')
      }

      if (sortKey === 'phone') {
        return (a.phone ?? '').localeCompare(b.phone ?? '')
      }

      if (sortKey === 'status') {
        return a.status.localeCompare(b.status)
      }

      return (a.name ?? '').localeCompare(b.name ?? '')
    })

    return sortDir === 'asc' ? sorted : sorted.reverse()
  }, [owners, statusFilter, sortKey, sortDir])

  const toggleSort = (key: OwnerSortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(key)
    setSortDir(key === 'confidence' ? 'desc' : 'asc')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <SearchBar value={search} onChange={setSearch} placeholder="Name, phone, unit number…" />
      <FilterChips options={subCommunities} selected={sub} onSelect={v => { setSub(v); setPage(1) }} />
      <div className="px-4 md:px-8 mb-2">
        <span className="text-xs text-[#555D55]">{count.toLocaleString()} owners</span>
      </div>
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
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <LoadingRow key={i} />)
          : owners.length === 0
          ? <EmptyState />
          : displayOwners.map(o => <OwnerCard key={o.id} owner={o} />)}
      </div>
      <div className="hidden px-4 md:block md:px-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-2">
            {Array.from({ length: 8 }).map((_, i) => <LoadingRow key={i} />)}
          </div>
        ) : owners.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#252825] bg-[#1A1D1A]">
            <div className="grid grid-cols-[minmax(220px,1.4fr)_150px_140px_1fr_120px_104px] gap-4 border-b border-[#252825] bg-[#161816] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#555D55]">
              <button onClick={() => toggleSort('name')} className="text-left">Owner</button>
              <button onClick={() => toggleSort('status')} className="text-left">Status</button>
              <button onClick={() => toggleSort('phone')} className="text-left">Phone</button>
              <button onClick={() => toggleSort('communities')} className="text-left">Communities</button>
              <button onClick={() => toggleSort('confidence')} className="text-left">Confidence</button>
              <span className="text-right">Call</span>
            </div>
            <div>
              {displayOwners.map(owner => (
                <div key={owner.id} className="grid grid-cols-[minmax(220px,1.4fr)_150px_140px_1fr_120px_104px] items-center gap-4 border-b border-[#252825] px-5 py-4 last:border-b-0 hover:bg-[#202320]">
                  <div className="min-w-0">
                    <button onClick={() => setSelectedOwnerId(owner.id)} className="block min-w-0 text-left">
                      <div className="truncate text-sm font-semibold text-[#E8ECE8] hover:text-[#C9A84C]">{owner.name ?? '—'}</div>
                    </button>
                    <div className="mt-1 text-xs text-[#555D55]">
                      {owner.unit_count} {owner.unit_count === 1 ? 'unit' : 'units'}
                      {(owner.unit_numbers ?? []).length > 0 && ` • ${(owner.unit_numbers ?? []).slice(0, 2).join(', ')}${owner.unit_count > 2 ? '…' : ''}`}
                    </div>
                  </div>
                  <div><StatusBadge status={owner.status} /></div>
                  <div className="truncate text-sm text-[#8A918A]">{formatPhone(owner.phone)}</div>
                  <div className="truncate text-sm text-[#8A918A]">{owner.sub_communities?.join(', ') || '—'}</div>
                  <div className={`text-sm font-medium ${confidenceColor(owner.confidence_score)}`}>
                    {owner.confidence_score != null ? `${owner.confidence_score}%` : '—'}
                  </div>
                  <div className="flex justify-end gap-2">
                    {owner.phone && (
                      <button
                        onClick={() => { window.location.href = getCallUrl(owner.phone) }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#252825] text-[#8A918A] transition-colors hover:text-[#E8ECE8]"
                      >
                        <Phone size={15} />
                      </button>
                    )}
                    {(owner.whatsapp || owner.phone) && (
                      <button
                        onClick={() => { window.open(getWhatsAppUrl(owner.whatsapp ?? owner.phone), '_blank', 'noopener,noreferrer') }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1a4030] bg-[#0d2318] text-[#4caf7d]"
                      >
                        <MessageCircle size={15} />
                      </button>
                    )}
                    {!owner.phone && !(owner.whatsapp || owner.phone) && <span className="text-xs text-[#555D55]">—</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <OwnerDrawer ownerId={selectedOwnerId} onClose={() => setSelectedOwnerId(null)} />
      {!loading && (
        <div ref={sentinelRef} className="px-4 py-6 flex justify-center">
          {loadingMore && <span className="text-xs text-[#555D55]">Loading more…</span>}
          {!hasMore && owners.length > 0 && (
            <span className="text-xs text-[#555D55]">All {count.toLocaleString()} owners loaded</span>
          )}
        </div>
      )}
    </div>
  )
}
