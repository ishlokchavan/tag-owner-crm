'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { PropertyDetail } from '@/types'
import { getProperties } from '@/services/properties'
import { SearchBar } from '@/components/ui/SearchBar'
import { FilterChips } from '@/components/ui/FilterChips'
import { LoadingRow } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { Building2, User } from 'lucide-react'
import { OwnerDrawer } from '@/components/owners/OwnerDrawer'

const PAGE_SIZE = 40
type PropertySortKey = 'unit' | 'community' | 'type' | 'beds'

export function PropertiesClient({ subCommunities }: { subCommunities: string[] }) {
  const [search, setSearch] = useState('')
  const [sub, setSub] = useState('')
  const [props, setProps] = useState<PropertyDetail[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sortKey, setSortKey] = useState<PropertySortKey>('unit')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchProps = useCallback(async (q: string, sc: string, p: number, append = false) => {
    if (p === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const result = await getProperties({ search: q, subCommunity: sc, page: p, pageSize: PAGE_SIZE })
      if (append) setProps(prev => [...prev, ...result.data])
      else setProps(result.data)
      setCount(result.count)
    } finally { setLoading(false); setLoadingMore(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(1); fetchProps(search, sub, 1, false) }, 300)
  }, [search, sub, fetchProps])

  const hasMore = props.length < count
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    const next = page + 1
    setPage(next)
    fetchProps(search, sub, next, true)
  }, [loadingMore, hasMore, page, search, sub, fetchProps])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore || loading) return
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '400px' }
    )
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, loading, loadMore])

  const displayProps = useMemo(() => {
    const sorted = [...props].sort((a, b) => {
      if (sortKey === 'beds') return (a.beds ?? -1) - (b.beds ?? -1)
      if (sortKey === 'community') return (a.sub_community || a.community || '').localeCompare(b.sub_community || b.community || '')
      if (sortKey === 'type') return (a.property_type || '').localeCompare(b.property_type || '')
      return a.unit_number.localeCompare(b.unit_number)
    })

    return sortDir === 'asc' ? sorted : sorted.reverse()
  }, [props, sortKey, sortDir])

  const toggleSort = (key: PropertySortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <SearchBar value={search} onChange={setSearch} placeholder="Unit number…" />
      <FilterChips options={subCommunities} selected={sub} onSelect={v => { setSub(v); setPage(1) }} />
      <div className="px-4 md:px-8 mb-2"><span className="text-xs text-[#555D55]">{count.toLocaleString()} units</span></div>
      <div className="hidden items-center justify-end px-4 pb-3 md:flex md:px-8">
        <span className="text-xs text-[#555D55]">Sorted by {sortKey} · {sortDir}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 px-4 md:hidden">
        {loading ? Array.from({ length: 10 }).map((_, i) => <LoadingRow key={i} />)
          : props.length === 0 ? <EmptyState />
          : displayProps.map(p => (
            <div key={p.id} className="bg-[#1A1D1A] border border-[#252825] rounded-2xl p-3.5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#252825] flex items-center justify-center flex-shrink-0">
                  <Building2 size={15} className="text-[#C9A84C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-[#E8ECE8]">{p.unit_number}</span>
                    {p.sub_community && <span className="text-[10px] px-2 py-0.5 bg-[#252825] rounded-full text-[#8A918A]">{p.sub_community}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#555D55]">
                    {p.property_type && <span>{p.property_type}</span>}
                    {p.beds && <><span>·</span><span>{p.beds} bed</span></>}
                  </div>
                  {p.owner_names && p.owner_names.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {p.owner_names.map((name, idx) => {
                        const ownerId = p.owner_ids?.[idx]
                        return ownerId ? (
                          <Link key={idx} href={`/owners/${ownerId}`} className="flex items-center gap-1.5 text-xs text-[#8A918A]">
                            <User size={11} className="text-[#555D55]" /><span className="truncate">{name}</span>
                          </Link>
                        ) : (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-[#8A918A]">
                            <User size={11} className="text-[#555D55]" /><span className="truncate">{name}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
      <div className="hidden px-4 md:block md:px-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-2">
            {Array.from({ length: 10 }).map((_, i) => <LoadingRow key={i} />)}
          </div>
        ) : props.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#252825] bg-[#1A1D1A]">
            <div className="grid grid-cols-[130px_180px_120px_120px_minmax(220px,1fr)] gap-4 border-b border-[#252825] bg-[#161816] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#555D55]">
              <button onClick={() => toggleSort('unit')} className="text-left">Unit</button>
              <button onClick={() => toggleSort('community')} className="text-left">Community</button>
              <button onClick={() => toggleSort('type')} className="text-left">Type</button>
              <button onClick={() => toggleSort('beds')} className="text-left">Beds</button>
              <span>Owners</span>
            </div>
            <div>
              {displayProps.map(property => (
                <div key={property.id} className="grid grid-cols-[130px_180px_120px_120px_minmax(220px,1fr)] items-center gap-4 border-b border-[#252825] px-5 py-4 last:border-b-0 hover:bg-[#202320]">
                  <div className="text-sm font-semibold text-[#E8ECE8]">{property.unit_number}</div>
                  <div className="truncate text-sm text-[#8A918A]">{property.sub_community || property.community || '—'}</div>
                  <div className="text-sm text-[#8A918A]">{property.property_type || '—'}</div>
                  <div className="text-sm text-[#8A918A]">{property.beds ? `${property.beds} bed` : '—'}</div>
                  <div className="flex flex-wrap gap-2">
                    {property.owner_names && property.owner_names.length > 0 ? (
                      property.owner_names.map((name, idx) => {
                        const ownerId = property.owner_ids?.[idx]
                        const chipClass = 'inline-flex max-w-full items-center gap-1 rounded-lg bg-[#252825] px-2.5 py-1.5 text-xs text-[#8A918A]'
                        return ownerId ? (
                          <button key={`${property.id}-${idx}`} onClick={() => setSelectedOwnerId(ownerId)} className={`${chipClass} hover:text-[#E8ECE8]`}>
                            <User size={11} className="text-[#555D55]" />
                            <span className="truncate">{name}</span>
                          </button>
                        ) : (
                          <span key={`${property.id}-${idx}`} className={chipClass}>
                            <User size={11} className="text-[#555D55]" />
                            <span className="truncate">{name}</span>
                          </span>
                        )
                      })
                    ) : (
                      <span className="text-sm text-[#555D55]">No owners linked</span>
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
          {!hasMore && props.length > 0 && (
            <span className="text-xs text-[#555D55]">All {count.toLocaleString()} units loaded</span>
          )}
        </div>
      )}
    </div>
  )
}
