interface StatCardProps { label: string; value: string | number; sub?: string; accent?: boolean }
export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="bg-[#1A1D1A] border border-[#252825] rounded-2xl p-4">
      <div className={`text-2xl font-bold tracking-tight ${accent ? 'text-[#C9A84C]' : 'text-[#E8ECE8]'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-[#555D55] mt-1 font-medium uppercase tracking-wide">{label}</div>
      {sub && <div className="text-xs text-[#8A918A] mt-0.5">{sub}</div>}
    </div>
  )
}
