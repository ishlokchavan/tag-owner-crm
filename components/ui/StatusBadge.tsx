import type { OwnerStatus } from '@/types'
import { statusLabel, statusColor } from '@/lib/utils'
export function StatusBadge({ status }: { status: OwnerStatus | null }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusColor(status)}`}>{statusLabel(status)}</span>
}
