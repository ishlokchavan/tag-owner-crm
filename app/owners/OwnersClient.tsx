'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { OwnerSummary } from '@/types'
import { getOwners } from '@/services/owners'
import { SearchBar } from '@/components/ui/SearchBar'
import { FilterChips } from '@/components/ui/FilterChips'
import { OwnerCard } from '@/components/ui/OwnerCard'
import { LoadingRow } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

const PAGE_SIZE = 30
const SCROLL_KEY = 'owners-scroll'

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

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} placeholder="Name, phone, unit number…" />
      <FilterChips options={subCommunities} selected={sub} onSelect={v => { setSub(v); setPage(1) }} />
      <div className="px-4 mb-2">
        <span className="text-xs text-[#555D55]">{count.toLocaleString()} owners</span>
      </div>
      <div className="flex flex-col gap-2 px-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <LoadingRow key={i} />)
          : owners.length === 0
          ? <EmptyState />
          : owners.map(o => <OwnerCard key={o.id} owner={o} />)}
      </div>
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
