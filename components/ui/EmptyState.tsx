export function EmptyState({ message = 'No results found' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-4xl mb-3 opacity-30">🔍</div>
      <p className="text-sm text-[#555D55]">{message}</p>
    </div>
  )
}
