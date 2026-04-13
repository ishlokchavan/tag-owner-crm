'use client'
interface FilterChipsProps { options: string[]; selected: string; onSelect: (v: string) => void; allLabel?: string }
export function FilterChips({ options, selected, onSelect, allLabel = 'All' }: FilterChipsProps) {
  return (
    <div className="flex gap-2 px-4 md:px-8 mb-3 overflow-x-auto pb-1">
      <button onClick={() => onSelect('')} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${selected === '' ? 'bg-[#C9A84C] text-[#0D0F0E]' : 'bg-[#1A1D1A] border border-[#252825] text-[#8A918A]'}`}>{allLabel}</button>
      {options.map(opt => (
        <button key={opt} onClick={() => onSelect(opt)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${selected === opt ? 'bg-[#C9A84C] text-[#0D0F0E]' : 'bg-[#1A1D1A] border border-[#252825] text-[#8A918A]'}`}>{opt}</button>
      ))}
    </div>
  )
}
