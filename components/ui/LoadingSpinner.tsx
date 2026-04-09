export function LoadingSpinner() {
  return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-[#252825] border-t-[#C9A84C] rounded-full animate-spin" /></div>
}
export function LoadingRow() {
  return (
    <div className="bg-[#1A1D1A] border border-[#252825] rounded-2xl p-3.5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#252825]" />
        <div className="flex-1"><div className="h-3.5 bg-[#252825] rounded w-2/3 mb-2" /><div className="h-2.5 bg-[#252825] rounded w-1/3" /></div>
      </div>
    </div>
  )
}
