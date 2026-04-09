'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { OwnerSummary } from '@/types'
import { getOwners } from '@/services/owners'
import { SearchBar } from '@/components/ui/SearchBar'
import { FilterChips } from '@/components/ui/FilterChips'
import { OwnerCard } from '@/components/ui/OwnerCard'
import { LoadingRow } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

const PAGE_SIZE = 30

export function OwnersClient({ subCommunities, initialSub }: { subCommunities: string[]; initialSub: string }) {
  const [search, setSearch] = useState('')
  const [sub, setSub] = useState(initialSub)
  const [owners, setOwners] = useState<OwnerSummary[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(1); fetchOwners(search, sub, 1, false) }, 300)
  }, [search, sub, fetchOwners])

  const hasMore = owners.length < count

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} placeholder="Name, phone, unit number…" />
      <FilterChips options={subCommunities} selected={sub} onSelect={v => { setSub(v); setPage(1) }} />
      <div className="px-4 mb-2"><span className="text-xs text-[#555D55]">{count.toLocaleString()} owners</span></div>
      <div className="flex flex-col gap-2 px-4">
        {loading ? Array.from({ length: 8 }).map((_, i) => <LoadingRow key={i} />)
          : owners.length === 0 ? <EmptyState />
          : owners.map(o => <OwnerCard key={o.id} owner={o} />)}
      </div>
      {!loading && hasMore && (
        <div className="px-4 py-4">
          <button onClick={() => { const next = page + 1; setPage(next); fetchOwners(search, sub, next, true) }}
            disabled={loadingMore}
            className="w-full py-3 bg-[#1A1D1A] border border-[#252825] rounded-xl text-sm text-[#8A918A] disabled:opacity-50">
            {loadingMore ? 'Loading…' : `Load more (${count - owners.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  )
}
