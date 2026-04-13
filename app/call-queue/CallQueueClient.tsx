'use client'

import { useState, useEffect, useCallback } from 'react'
import { OwnerStatus, InteractionOutcome, NoteType } from '@/types'
import { ProspectRow, loadDailyQueue, completeProspect, updateProspectOwnerStatus } from '@/services/prospecting'
import { getCallUrl, getWhatsAppUrl, initials, confidenceColor, statusLabel } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Phone, MessageCircle, ChevronRight, Building2, CheckCircle } from 'lucide-react'

const PERSIST_KEY = 'prospect-idx'

const QUICK_OUTCOMES: { value: InteractionOutcome; label: string; color: string; icon?: string }[] = [
  { value: 'answered',      label: 'Answered',      color: 'bg-green-900 border-green-700 text-green-300',  icon: '✓' },
  { value: 'no_answer',     label: 'No Answer',      color: 'bg-[#252825] border-[#2E322E] text-[#8A918A]', icon: '↩' },
  { value: 'voicemail',     label: 'Voicemail',      color: 'bg-[#252825] border-[#2E322E] text-[#8A918A]', icon: '📭' },
  { value: 'not_interested',label: 'Not Interested', color: 'bg-red-900 border-red-700 text-red-300',       icon: '✕' },
  { value: 'interested',    label: 'Interested',     color: 'bg-amber-900 border-amber-700 text-amber-300', icon: '★' },
  { value: 'callback',      label: 'Callback',       color: 'bg-blue-900 border-blue-700 text-blue-300',    icon: '↻' },
  { value: 'wrong_number',  label: 'Wrong #',        color: 'bg-zinc-800 border-zinc-600 text-zinc-400',    icon: '?' },
]

const STATUSES: OwnerStatus[] = ['new', 'cold', 'warm', 'hot', 'contacted', 'not_interested']

export function CallQueueClient() {
  const [queue, setQueue]       = useState<ProspectRow[]>([])
  const [idx, setIdx]           = useState(0)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('call')
  const [showNote, setShowNote] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [pendingOutcome, setPendingOutcome] = useState<InteractionOutcome | null>(null)
  const [error, setError]       = useState<string | null>(null)

  // Load queue on mount, restore last position
  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await loadDailyQueue()
      setQueue(data)
      // Restore to first uncalled entry (or last saved idx as fallback)
      const firstUncalled = data.findIndex(r => !r.called)
      const saved = parseInt(sessionStorage.getItem(PERSIST_KEY) ?? '0', 10)
      setIdx(firstUncalled >= 0 ? firstUncalled : Math.min(saved, data.length - 1))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadQueue() }, [loadQueue])

  // Persist current index
  useEffect(() => {
    sessionStorage.setItem(PERSIST_KEY, String(idx))
  }, [idx])

  const current = queue[idx]
  const calledCount = queue.filter(r => r.called).length
  const progress = queue.length > 0 ? (calledCount / queue.length) * 100 : 0

  const handleOutcomeSelect = (outcome: InteractionOutcome) => {
    setPendingOutcome(outcome)
    setShowNote(true)
  }

  const handleCompleteCall = async () => {
    if (!current || !pendingOutcome || saving) return
    setSaving(true)
    try {
      await completeProspect(current.prospect_id, current.id, pendingOutcome, noteText || undefined)
      setQueue(prev => prev.map((r, i) => i === idx ? { ...r, called: true, outcome: pendingOutcome } : r))
      resetCallState()
      advanceToNext()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (status: OwnerStatus) => {
    if (!current || saving) return
    setSaving(true)
    try {
      await updateProspectOwnerStatus(current.id, status)
      setQueue(prev => prev.map((r, i) => i === idx ? { ...r, status } : r))
      setShowStatus(false)
    } finally { setSaving(false) }
  }

  const resetCallState = () => {
    setNoteText('')
    setNoteType('call')
    setShowNote(false)
    setShowStatus(false)
    setPendingOutcome(null)
  }

  const advanceToNext = () => {
    const next = queue.findIndex((r, i) => i > idx && !r.called)
    if (next >= 0) setIdx(next)
    else setIdx(prev => prev + 1) // natural advance past end shows completion screen
  }

  const handleSkip = () => { resetCallState(); advanceToNext() }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <LoadingSpinner />
      <p className="text-xs text-[#555D55]">Generating your daily queue…</p>
    </div>
  )

  if (error) return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm text-red-400 mb-4">{error}</p>
      <button onClick={loadQueue} className="px-6 py-3 bg-[#1A1D1A] border border-[#252825] rounded-xl text-sm text-[#8A918A]">Retry</button>
    </div>
  )

  if (queue.length === 0) return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-4xl mb-4">📋</div>
      <h2 className="text-lg font-semibold text-[#E8ECE8] mb-2">No Queue Available</h2>
      <p className="text-sm text-[#555D55]">No Elan owners available today. Check back tomorrow.</p>
    </div>
  )

  const allDone = calledCount === queue.length || idx >= queue.length

  if (allDone) return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[#0d2318] border border-[#1a4030] flex items-center justify-center mb-4">
        <CheckCircle size={28} className="text-[#4caf7d]" />
      </div>
      <h2 className="text-lg font-semibold text-[#E8ECE8] mb-2">Day Complete!</h2>
      <p className="text-sm text-[#555D55] mb-1">{calledCount} of {queue.length} owners called</p>
      <p className="text-xs text-[#3a4a3a] mb-8">Elan · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
      <button onClick={() => { setIdx(0); setQueue(q => q.map(r => r)) }}
        className="px-6 py-3 bg-[#1A1D1A] border border-[#252825] rounded-xl text-sm text-[#8A918A]">
        Review Queue
      </button>
    </div>
  )

  return (
    <div className="px-4 pb-6 max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-[#555D55] mb-2">
          <span>{calledCount} called</span>
          <span className="text-[#C9A84C] font-medium">Elan · {queue.length} today</span>
          <span>{queue.length - calledCount} left</span>
        </div>
        <div className="w-full h-1.5 bg-[#252825] rounded-full overflow-hidden">
          <div className="h-full bg-[#C9A84C] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Owner card */}
      <div className="bg-[#1A1D1A] border border-[#252825] rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[#3a4a3a] font-medium">#{current.position}</span>
          {current.called && (
            <span className="text-[10px] px-2 py-0.5 bg-[#0d2318] text-[#4caf7d] rounded-full border border-[#1a4030]">Called</span>
          )}
        </div>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#252825] border border-[#2E322E] flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-[#8A918A]">{initials(current.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-[#E8ECE8] mb-1 truncate">{current.name ?? '—'}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={current.status} />
              {current.confidence_score != null && (
                <span className={`text-xs font-medium ${confidenceColor(current.confidence_score)}`}>
                  {current.confidence_score}%
                </span>
              )}
              {current.unit_count > 1 && (
                <span className="text-xs text-[#C9A84C] font-medium">{current.unit_count} units</span>
              )}
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
          <a href={getCallUrl(current.phone)}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#C9A84C] text-[#0D0F0E] rounded-xl font-bold text-base active:opacity-80">
            <Phone size={20} />{current.phone ?? 'No phone'}
          </a>
          {(current.whatsapp || current.phone) && (
            <a href={getWhatsAppUrl(current.whatsapp ?? current.phone)}
              target="_blank" rel="noopener noreferrer"
              className="w-14 flex items-center justify-center bg-[#0d2318] border border-[#1a4030] text-[#4caf7d] rounded-xl">
              <MessageCircle size={20} />
            </a>
          )}
        </div>
      </div>

      {/* Outcome selection (step 1) */}
      {!showNote && !current.called && (
        <div className="mb-4">
          <p className="text-xs text-[#555D55] uppercase tracking-wide mb-2">Log Outcome</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_OUTCOMES.map(o => (
              <button key={o.value} onClick={() => handleOutcomeSelect(o.value)} disabled={saving}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium disabled:opacity-40 ${o.color}`}>
                <span>{o.icon}</span>{o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Note + confirm (step 2) */}
      {showNote && pendingOutcome && (
        <div className="mb-4 bg-[#1A1D1A] border border-[#252825] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#555D55] uppercase tracking-wide">
              Outcome: <span className="text-[#E8ECE8] normal-case font-medium">{pendingOutcome.replace('_', ' ')}</span>
            </span>
            <button onClick={() => { setPendingOutcome(null); setShowNote(false) }}
              className="text-xs text-[#555D55]">Change</button>
          </div>
          <textarea
            value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Add a note (optional)…" rows={2} autoFocus
            className="w-full bg-[#252825] rounded-xl px-3 py-2 text-sm text-[#E8ECE8] placeholder:text-[#555D55] outline-none resize-none mb-3" />
          <button onClick={handleCompleteCall} disabled={saving}
            className="w-full py-3 bg-[#C9A84C] text-[#0D0F0E] rounded-xl text-sm font-semibold disabled:opacity-40">
            {saving ? 'Saving…' : 'Complete & Next'}
          </button>
        </div>
      )}

      {/* Status update */}
      {showStatus ? (
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
      ) : (
        <button onClick={() => setShowStatus(true)}
          className="w-full py-2.5 bg-[#1A1D1A] border border-[#252825] rounded-xl text-sm text-[#8A918A] mb-3">
          Update Status
        </button>
      )}

      {/* Skip / navigation */}
      <div className="flex gap-2">
        <button onClick={handleSkip}
          className="flex-1 py-3.5 bg-[#1A1D1A] border border-[#252825] rounded-xl text-sm text-[#555D55]">
          Skip
        </button>
        <button onClick={advanceToNext}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#252825] rounded-xl text-sm font-medium text-[#E8ECE8]">
          Next <ChevronRight size={16} />
        </button>
      </div>

      {/* Mini queue strip */}
      <div className="mt-5 flex gap-1 overflow-x-auto pb-1">
        {queue.map((r, i) => (
          <button key={r.prospect_id} onClick={() => { resetCallState(); setIdx(i) }}
            className={`flex-shrink-0 w-6 h-6 rounded-md text-[9px] font-bold transition-colors ${
              i === idx ? 'bg-[#C9A84C] text-[#0D0F0E]'
              : r.called   ? 'bg-[#0d2318] text-[#4caf7d] border border-[#1a4030]'
              : 'bg-[#252825] text-[#555D55]'
            }`}>
            {r.position}
          </button>
        ))}
      </div>
    </div>
  )
}
