'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PropertyDetail } from '@/types'
import { getProperties } from '@/services/properties'
import { SearchBar } from '@/components/ui/SearchBar'
import { FilterChips } from '@/components/ui/FilterChips'
import { LoadingRow } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { Building2, User } from 'lucide-react'

const PAGE_SIZE = 40

export function PropertiesClient({ subCommunities }: { subCommunities: string[] }) {
  const [search, setSearch] = useState('')
  const [sub, setSub] = useState('')
  const [props, setProps] = useState<PropertyDetail[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} placeholder="Unit number…" />
      <FilterChips options={subCommunities} selected={sub} onSelect={v => { setSub(v); setPage(1) }} />
      <div className="px-4 mb-2"><span className="text-xs text-[#555D55]">{count.toLocaleString()} units</span></div>
      <div className="flex flex-col gap-2 px-4">
        {loading ? Array.from({ length: 10 }).map((_, i) => <LoadingRow key={i} />)
          : props.length === 0 ? <EmptyState />
          : props.map(p => (
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
      {!loading && props.length < count && (
        <div className="px-4 py-4">
          <button onClick={() => { const next = page + 1; setPage(next); fetchProps(search, sub, next, true) }}
            disabled={loadingMore} className="w-full py-3 bg-[#1A1D1A] border border-[#252825] rounded-xl text-sm text-[#8A918A] disabled:opacity-50">
            {loadingMore ? 'Loading…' : `Load more (${count - props.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  )
}
