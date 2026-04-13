'use client'
import { Search, X } from 'lucide-react'
interface SearchBarProps { value: string; onChange: (v: string) => void; placeholder?: string }
export function SearchBar({ value, onChange, placeholder = 'Search…' }: SearchBarProps) {
  return (
    <div className="relative mx-4 md:mx-8 mb-3">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555D55]" />
      <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#1A1D1A] border border-[#252825] rounded-xl pl-9 pr-9 py-2.5 text-sm text-[#E8ECE8] placeholder:text-[#555D55] outline-none focus:border-[#C9A84C] transition-colors" />
      {value && <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555D55]"><X size={15} /></button>}
    </div>
  )
}
