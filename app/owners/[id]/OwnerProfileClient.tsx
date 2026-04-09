'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OwnerSummary, Note, Interaction, OwnerStatus, NoteType, InteractionOutcome } from '@/types'
import { addNote, logInteraction, updateOwnerStatus } from '@/services/owners'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getCallUrl, getWhatsAppUrl, initials, confidenceColor, statusLabel } from '@/lib/utils'
import { Phone, MessageCircle, ArrowLeft } from 'lucide-react'

const STATUSES: OwnerStatus[] = ['new', 'cold', 'warm', 'hot', 'contacted', 'not_interested', 'closed']
const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow Up' },
]
const OUTCOMES: { value: InteractionOutcome; label: string }[] = [
  { value: 'answered', label: 'Answered' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'callback', label: 'Callback' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'wrong_number', label: 'Wrong Number' },
]

export function OwnerProfileClient({ owner: initialOwner, initialNotes, initialInteractions }:
  { owner: OwnerSummary; initialNotes: Note[]; initialInteractions: Interaction[] }) {
  const router = useRouter()
  const [owner, setOwner] = useState(initialOwner)
  const [notes, setNotes] = useState(initialNotes)
  const [interactions, setInteractions] = useState(initialInteractions)
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('general')
  const [outcome, setOutcome] = useState<InteractionOutcome>('answered')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'notes' | 'interactions' | 'status'>('notes')

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setSaving(true)
    try {
      await addNote(owner.id, noteText.trim(), noteType)
      setNotes(prev => [{ id: Date.now().toString(), owner_id: owner.id, note: noteText.trim(), note_type: noteType, created_at: new Date().toISOString() }, ...prev])
      setNoteText('')
    } finally { setSaving(false) }
  }

  const handleLogCall = async () => {
    setSaving(true)
    try {
      await logInteraction(owner.id, 'call', outcome)
      setInteractions(prev => [{ id: Date.now().toString(), owner_id: owner.id, interaction_type: 'call', outcome, created_at: new Date().toISOString() }, ...prev])
    } finally { setSaving(false) }
  }

  const handleUpdateStatus = async (status: OwnerStatus) => {
    setSaving(true)
    try {
      await updateOwnerStatus(owner.id, status)
      setOwner(prev => ({ ...prev, status }))
    } finally { setSaving(false) }
  }

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-[#8A918A]"><ArrowLeft size={20} /></button>
        <span className="text-sm text-[#555D55]">Owner Profile</span>
      </div>
      <div className="mx-4 mb-4 bg-[#1A1D1A] border border-[#252825] rounded-2xl p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#252825] border border-[#2E322E] flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-[#8A918A]">{initials(owner.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-[#E8ECE8] mb-1">{owner.name ?? '—'}</h1>
            <StatusBadge status={owner.status} />
            {owner.confidence_score != null && (
              <span className={`ml-2 text-xs font-medium ${confidenceColor(owner.confidence_score)}`}>{owner.confidence_score}% confidence</span>
            )}
          </div>
        </div>
        {owner.unit_count > 0 && (
          <div className="mb-3">
            <div className="text-xs text-[#555D55] uppercase tracking-wide mb-1.5">Units Owned</div>
            <div className="flex flex-wrap gap-1.5">
              {(owner.unit_numbers ?? []).map(u => <span key={u} className="px-2 py-1 bg-[#252825] rounded-lg text-xs text-[#C9A84C] font-medium">{u}</span>)}
            </div>
          </div>
        )}
        {owner.sub_communities && owner.sub_communities.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-[#555D55] uppercase tracking-wide mb-1.5">Communities</div>
            <div className="flex flex-wrap gap-1.5">
              {owner.sub_communities.map(sc => <span key={sc} className="px-2 py-1 bg-[#252825] rounded-lg text-xs text-[#8A918A]">{sc}</span>)}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <a href={getCallUrl(owner.phone)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold ${owner.phone ? 'bg-[#C9A84C] text-[#0D0F0E]' : 'bg-[#252825] text-[#555D55] pointer-events-none'}`}>
            <Phone size={16} />{owner.phone ?? 'No phone'}
          </a>
          {(owner.whatsapp || owner.phone) && (
            <a href={getWhatsAppUrl(owner.whatsapp ?? owner.phone)} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0d2318] border border-[#1a4030] text-[#4caf7d] rounded-xl text-sm font-semibold">
              <MessageCircle size={16} />WhatsApp
            </a>
          )}
        </div>
      </div>
      <div className="flex gap-0 mx-4 mb-4 bg-[#1A1D1A] border border-[#252825] rounded-xl p-1">
        {(['notes', 'interactions', 'status'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${tab === t ? 'bg-[#252825] text-[#E8ECE8]' : 'text-[#555D55]'}`}>{t}</button>
        ))}
      </div>
      {tab === 'notes' && (
        <div className="px-4">
          <div className="flex gap-2 mb-2 overflow-x-auto">
            {NOTE_TYPES.map(nt => (
              <button key={nt.value} onClick={() => setNoteType(nt.value)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium ${noteType === nt.value ? 'bg-[#C9A84C] text-[#0D0F0E]' : 'bg-[#1A1D1A] border border-[#252825] text-[#8A918A]'}`}>
                {nt.label}
              </button>
            ))}
          </div>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note…" rows={3}
            className="w-full bg-[#1A1D1A] border border-[#252825] rounded-xl px-4 py-3 text-sm text-[#E8ECE8] placeholder:text-[#555D55] outline-none focus:border-[#C9A84C] resize-none mb-2" />
          <button onClick={handleAddNote} disabled={!noteText.trim() || saving}
            className="w-full py-3 bg-[#C9A84C] text-[#0D0F0E] rounded-xl text-sm font-semibold disabled:opacity-40 mb-4">
            {saving ? 'Saving…' : 'Save Note'}
          </button>
          <div className="flex flex-col gap-2">
            {notes.map(n => (
              <div key={n.id} className="bg-[#1A1D1A] border border-[#252825] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] px-2 py-0.5 bg-[#252825] rounded-full text-[#8A918A] uppercase tracking-wide">{n.note_type}</span>
                  <span className="text-[10px] text-[#555D55]">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-[#E8ECE8] leading-relaxed">{n.note}</p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-sm text-[#555D55] text-center py-6">No notes yet</p>}
          </div>
        </div>
      )}
      {tab === 'interactions' && (
        <div className="px-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {OUTCOMES.map(o => (
              <button key={o.value} onClick={() => setOutcome(o.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${outcome === o.value ? 'bg-[#C9A84C] text-[#0D0F0E]' : 'bg-[#1A1D1A] border border-[#252825] text-[#8A918A]'}`}>
                {o.label}
              </button>
            ))}
          </div>
          <button onClick={handleLogCall} disabled={saving}
            className="w-full py-3 bg-[#C9A84C] text-[#0D0F0E] rounded-xl text-sm font-semibold disabled:opacity-40 mb-4">
            {saving ? 'Logging…' : 'Log Call'}
          </button>
          <div className="flex flex-col gap-2">
            {interactions.map(i => (
              <div key={i.id} className="bg-[#1A1D1A] border border-[#252825] rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#252825] flex items-center justify-center"><Phone size={13} className="text-[#8A918A]" /></div>
                <div className="flex-1">
                  <div className="text-sm text-[#E8ECE8] capitalize">{i.interaction_type}</div>
                  {i.outcome && <div className="text-xs text-[#555D55]">{i.outcome.replace('_', ' ')}</div>}
                </div>
                <span className="text-[10px] text-[#555D55]">{new Date(i.created_at).toLocaleDateString()}</span>
              </div>
            ))}
            {interactions.length === 0 && <p className="text-sm text-[#555D55] text-center py-6">No interactions logged</p>}
          </div>
        </div>
      )}
      {tab === 'status' && (
        <div className="px-4">
          <div className="text-xs text-[#555D55] uppercase tracking-wide mb-3">Update Lead Status</div>
          <div className="flex flex-col gap-2">
            {STATUSES.map(s => (
              <button key={s} onClick={() => handleUpdateStatus(s)} disabled={saving}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium disabled:opacity-50 ${owner.status === s ? 'bg-[#C9A84C] border-[#C9A84C] text-[#0D0F0E]' : 'bg-[#1A1D1A] border-[#252825] text-[#8A918A]'}`}>
                <span className="capitalize">{statusLabel(s)}</span>
                {owner.status === s && <span className="text-xs">✓ Current</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
