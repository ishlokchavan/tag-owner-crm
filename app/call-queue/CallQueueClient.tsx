'use client'

import { useState, useEffect, useCallback } from 'react'
import { OwnerSummary, InteractionOutcome, NoteType, OwnerStatus } from '@/types'
import { getCallQueue, addNote, logInteraction, updateOwnerStatus } from '@/services/owners'
import { getCallUrl, getWhatsAppUrl, initials, confidenceColor, statusLabel } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Phone, MessageCircle, ChevronRight, Building2, CheckCircle, XCircle, PhoneMissed, Voicemail } from 'lucide-react'

const QUICK_OUTCOMES: { value: InteractionOutcome; label: string; color: string }[] = [
  { value: 'answered', label: 'Answered', color: 'bg-green-900 border-green-700 text-green-300' },
  { value: 'no_answer', label: 'No Answer', color: 'bg-[#252825] border-[#2E322E] text-[#8A918A]' },
  { value: 'voicemail', label: 'Voicemail', color: 'bg-[#252825] border-[#2E322E] text-[#8A918A]' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-red-900 border-red-700 text-red-300' },
  { value: 'interested', label: 'Interested', color: 'bg-amber-900 border-amber-700 text-amber-300' },
  { value: 'callback', label: 'Callback', color: 'bg-blue-900 border-blue-700 text-blue-300' },
  { value: 'wrong_number', label: 'Wrong #', color: 'bg-zinc-800 border-zinc-600 text-zinc-400' },
]
const STATUSES: OwnerStatus[] = ['new', 'cold', 'warm', 'hot', 'contacted', 'not_interested']

export function CallQueueClient() {
  const [queue, setQueue] = useState<OwnerSummary[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('call')
  const [showNote, setShowNote] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [calledToday, setCalledToday] = useState(0)

  const loadQueue = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getCallQueue(1, 50)
      setQueue(result.data)
      setTotalCount(result.count)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadQueue() }, [loadQueue])

  const current = queue[currentIdx]

  const handleOutcome = async (outcome: InteractionOutcome) => {
    if (!current || saving) return
    setSaving(true)
    try { await logInteraction(current.id, 'call', outcome); setCalledToday(c => c + 1) }
    finally { setSaving(false) }
  }

  const handleSaveNote = async () => {
    if (!current || !noteText.trim() || saving) return
    setSaving(true)
    try { await addNote(current.id, noteText.trim(), noteType); setNoteText(''); setShowNote(false) }
    finally { setSaving(false) }
  }

  const handleUpdateStatus = async (status: OwnerStatus) => {
    if (!current || saving) return
    setSaving(true)
    try {
      await updateOwnerStatus(current.id, status)
      setQueue(prev => prev.map((o, i) => i === currentIdx ? { ...o, status } : o))
      setShowStatus(false)
    } finally { setSaving(false) }
  }

  const handleNext = () => { setCurrentIdx(i => i + 1); setShowNote(false); setShowStatus(false); setNoteText('') }

  if (loading) return <LoadingSpinner />

  if (!current || currentIdx >= queue.length) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-lg font-semibold text-[#E8ECE8] mb-2">Queue Complete</h2>
        <p className="text-sm text-[#555D55] mb-2">Called {calledToday} owner{calledToday !== 1 ? 's' : ''} this session</p>
        <p className="text-xs text-[#555D55] mb-6">{totalCount} total in queue</p>
        <button onClick={() => { setCurrentIdx(0); loadQueue() }} className="px-6 py-3 bg-[#C9A84C] text-[#0D0F0E] rounded-xl text-sm font-semibold">Restart Queue</button>
      </div>
    )
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-4 text-xs text-[#555D55]">
        <span>{currentIdx + 1} of {queue.length} loaded</span>
        <span className="text-[#C9A84C] font-medium">{calledToday} called today</span>
        <span>{queue.length - currentIdx - 1} remaining</span>
      </div>
      <div className="w-full h-1 bg-[#252825] rounded-full mb-5 overflow-hidden">
        <div className="h-full bg-[#C9A84C] rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (currentIdx / Math.max(1, queue.length)) * 100)}%` }} />
      </div>
      <div className="bg-[#1A1D1A] border border-[#252825] rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#252825] border border-[#2E322E] flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-[#8A918A]">{initials(current.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-[#E8ECE8] mb-1 truncate">{current.name ?? '—'}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={current.status} />
              {current.confidence_score != null && <span className={`text-xs font-medium ${confidenceColor(current.confidence_score)}`}>{current.confidence_score}%</span>}
              {current.unit_count > 1 && <span className="text-xs text-[#C9A84C] font-medium">{current.unit_count} units</span>}
            </div>
          </div>
        </div>
        {current.unit_numbers && current.unit_numbers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {current.unit_numbers.map(u => (
              <span key={u} className="px-2 py-1 bg-[#252825] rounded-lg text-[10px] text-[#C9A84C] font-medium flex items-center gap-1">
                <Building2 size={9} />{u}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <a href={getCallUrl(current.phone)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#C9A84C] text-[#0D0F0E] rounded-xl font-bold text-base">
            <Phone size={20} />{current.phone ?? 'No phone'}
          </a>
          {(current.whatsapp || current.phone) && (
            <a href={getWhatsAppUrl(current.whatsapp ?? current.phone)} target="_blank" rel="noopener noreferrer"
              className="w-14 flex items-center justify-center bg-[#0d2318] border border-[#1a4030] text-[#4caf7d] rounded-xl">
              <MessageCircle size={20} />
            </a>
          )}
        </div>
      </div>
      <div className="mb-4">
        <p className="text-xs text-[#555D55] uppercase tracking-wide mb-2">Log Outcome</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_OUTCOMES.map(o => (
            <button key={o.value} onClick={() => handleOutcome(o.value)} disabled={saving}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium disabled:opacity-40 ${o.color}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-3">
        {!showNote ? (
          <button onClick={() => setShowNote(true)} className="w-full py-3 bg-[#1A1D1A] border border-[#252825] rounded-xl text-sm text-[#8A918A] text-left px-4">+ Add note…</button>
        ) : (
          <div className="bg-[#1A1D1A] border border-[#252825] rounded-xl p-3">
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Note…" rows={2}
              className="w-full bg-[#252825] rounded-lg px-3 py-2 text-sm text-[#E8ECE8] placeholder:text-[#555D55] outline-none resize-none mb-2" autoFocus />
            <div className="flex gap-2">
              <button onClick={handleSaveNote} disabled={!noteText.trim() || saving}
                className="flex-1 py-2 bg-[#C9A84C] text-[#0D0F0E] rounded-lg text-sm font-semibold disabled:opacity-40">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setShowNote(false); setNoteText('') }} className="px-4 py-2 bg-[#252825] rounded-lg text-sm text-[#8A918A]">Cancel</button>
            </div>
          </div>
        )}
      </div>
      {showStatus && (
        <div className="mb-3 bg-[#1A1D1A] border border-[#252825] rounded-xl p-3">
          <div className="grid grid-cols-2 gap-1.5">
            {STATUSES.map(s => (
              <button key={s} onClick={() => handleUpdateStatus(s)} disabled={saving}
                className={`py-2 rounded-lg text-xs font-medium capitalize disabled:opacity-50 ${current.status === s ? 'bg-[#C9A84C] text-[#0D0F0E]' : 'bg-[#252825] text-[#8A918A]'}`}>
                {statusLabel(s)}
              </button>
            ))}
          </div>
          <button onClick={() => setShowStatus(false)} className="w-full mt-2 text-xs text-[#555D55] py-1">Cancel</button>
        </div>
      )}
      {!showStatus && (
        <button onClick={() => setShowStatus(true)} className="w-full py-2.5 bg-[#1A1D1A] border border-[#252825] rounded-xl text-sm text-[#8A918A] mb-3">Update Status</button>
      )}
      <div className="flex gap-2">
        <button onClick={handleNext} className="flex-1 py-3.5 bg-[#1A1D1A] border border-[#252825] rounded-xl text-sm text-[#555D55]">Skip</button>
        <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#252825] rounded-xl text-sm font-medium text-[#E8ECE8]">
          Next Lead <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
