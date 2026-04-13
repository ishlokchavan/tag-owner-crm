import Link from 'next/link'
import { Phone } from 'lucide-react'
import { OwnerSummary } from '@/types'
import { StatusBadge } from './StatusBadge'
import { initials, confidenceColor, formatPhone, getCallUrl } from '@/lib/utils'

export function OwnerCard({ owner, showUnits = true }: { owner: OwnerSummary; showUnits?: boolean }) {
  return (
    <Link href={`/owners/${owner.id}`} className="flex items-center gap-3 bg-[#1A1D1A] border border-[#252825] rounded-2xl p-3.5 active:bg-[#252825] transition-colors">
      <div className="w-10 h-10 rounded-full bg-[#252825] border border-[#2E322E] flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-semibold text-[#8A918A]">{initials(owner.name)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-[#E8ECE8] truncate">{owner.name ?? '—'}</span>
          <StatusBadge status={owner.status} />
        </div>
        <div className="flex items-center gap-2 text-xs text-[#555D55]">
          <span className="truncate">{formatPhone(owner.phone) || 'No phone'}</span>
          {showUnits && owner.unit_count > 0 && <><span>·</span><span className={owner.unit_count > 1 ? 'text-[#C9A84C] font-medium' : ''}>{owner.unit_count} unit{owner.unit_count !== 1 ? 's' : ''}</span></>}
          {owner.confidence_score != null && <><span>·</span><span className={confidenceColor(owner.confidence_score)}>{owner.confidence_score}%</span></>}
        </div>
        {showUnits && owner.sub_communities && owner.sub_communities.length > 0 && (
          <div className="text-[10px] text-[#555D55] mt-0.5 truncate">{owner.sub_communities.join(', ')}</div>
        )}
      </div>
      {owner.phone && (
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = getCallUrl(owner.phone!) }}
          className="flex-shrink-0 w-9 h-9 bg-[#252825] rounded-xl flex items-center justify-center">
          <Phone size={15} className="text-[#8A918A]" />
        </button>
      )}
    </Link>
  )
}
