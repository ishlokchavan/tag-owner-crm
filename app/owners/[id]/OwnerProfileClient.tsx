'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  OwnerSummary,
  Note,
  Interaction,
  OwnerStatus,
  NoteType,
} from '@/types'
import type { AgentLookup } from '@/services/owners'
import { addNote, updateOwnerStatus } from '@/services/owners'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getCallUrl, getWhatsAppUrl, formatPhone, initials, confidenceColor, statusLabel } from '@/lib/utils'
import { Phone, MessageCircle, ArrowLeft, FileText, ShieldCheck, UserRound, CircleDot } from 'lucide-react'

const STATUSES: OwnerStatus[] = ['new', 'cold', 'warm', 'hot', 'contacted', 'not_interested', 'closed']
const STATUS_META: Record<OwnerStatus, { tone: string; hint: string; summary: string }> = {
  new: {
    tone: 'border-slate-700 bg-slate-900/40 text-slate-300',
    hint: 'Fresh lead with no meaningful engagement yet.',
    summary: 'Best next step: first outreach or qualification.',
  },
  cold: {
    tone: 'border-blue-800 bg-blue-950/40 text-blue-300',
    hint: 'Low engagement or weak buying signal so far.',
    summary: 'Best next step: light follow-up or nurture.',
  },
  warm: {
    tone: 'border-amber-800 bg-amber-950/40 text-amber-300',
    hint: 'Some responsiveness or promising context exists.',
    summary: 'Best next step: timely follow-up with context.',
  },
  hot: {
    tone: 'border-red-800 bg-red-950/40 text-red-300',
    hint: 'High intent, urgency, or strong conversion potential.',
    summary: 'Best next step: immediate action and close support.',
  },
  contacted: {
    tone: 'border-green-800 bg-green-950/40 text-green-300',
    hint: 'Reached successfully, but still open to progress.',
    summary: 'Best next step: update outcome or move status onward.',
  },
  not_interested: {
    tone: 'border-zinc-700 bg-zinc-900/60 text-zinc-300',
    hint: 'Owner has declined or shown no meaningful interest.',
    summary: 'Best next step: archive context and avoid noisy follow-up.',
  },
  closed: {
    tone: 'border-fuchsia-800 bg-fuchsia-950/40 text-fuchsia-300',
    hint: 'Opportunity resolved or no further action needed.',
    summary: 'Best next step: maintain history only.',
  },
}
const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow Up' },
]

type TimelineItem =
  | { id: string; kind: 'note'; created_at: string; note: Note }
  | { id: string; kind: 'interaction'; created_at: string; interaction: Interaction }

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getActorName(agentId: string | null | undefined, agentMap: Map<string, string>) {
  if (!agentId) return null
  return agentMap.get(agentId) ?? 'Unknown agent'
}

function prettifyLabel(value: string) {
  return value.replace(/_/g, ' ')
}

function getStatusChangeText(note: Note) {
  const match = note.note.match(/^Status changed from ([a-z_]+) to ([a-z_]+)$/i)
  if (!match) return null

  return {
    from: prettifyLabel(match[1]),
    to: prettifyLabel(match[2]),
  }
}

function normalizeName(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function timelineCategoryLabel(item: TimelineItem) {
  if (item.kind === 'note') {
    return getStatusChangeText(item.note) ? 'status' : prettifyLabel(item.note.note_type)
  }

  return prettifyLabel(item.interaction.interaction_type)
}

function timelineActor(item: TimelineItem, agentMap: Map<string, string>) {
  return item.kind === 'note'
    ? getActorName(item.note.agent_id, agentMap)
    : getActorName(item.interaction.agent_id, agentMap)
}

function timelineDescription(item: TimelineItem) {
  if (item.kind === 'note') {
    const statusChange = getStatusChangeText(item.note)
    if (statusChange) {
      return `Changed from ${statusChange.from} to ${statusChange.to}`
    }
    return item.note.note
  }

  return `${prettifyLabel(item.interaction.interaction_type)}${
    item.interaction.outcome ? ` • ${prettifyLabel(item.interaction.outcome)}` : ''
  }`
}

export function OwnerProfileClient({
  owner: initialOwner,
  initialNotes,
  initialInteractions,
  agents,
  activeAgents,
  embedded = false,
  onClose,
}: {
  owner: OwnerSummary
  initialNotes: Note[]
  initialInteractions: Interaction[]
  agents: AgentLookup[]
  activeAgents: AgentLookup[]
  embedded?: boolean
  onClose?: () => void
}) {
  const router = useRouter()
  const [owner, setOwner] = useState(initialOwner)
  const [notes, setNotes] = useState(initialNotes)
  const [interactions, setInteractions] = useState(initialInteractions)
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('general')
  const [saving, setSaving] = useState(false)

  const agentMap = useMemo(
    () => new Map(agents.map(agent => [agent.id, agent.name?.trim() || 'Unknown agent'])),
    [agents]
  )

  const possibleAgentMatches = useMemo(() => {
    const ownerName = normalizeName(owner.name)
    if (!ownerName) return []

    return activeAgents.filter(agent => normalizeName(agent.name) === ownerName)
  }, [activeAgents, owner.name])

  const timeline = useMemo<TimelineItem[]>(
    () =>
      [
        ...notes.map(note => ({
          id: `note-${note.id}`,
          kind: 'note' as const,
          created_at: note.created_at,
          note,
        })),
        ...interactions.map(interaction => ({
          id: `interaction-${interaction.id}`,
          kind: 'interaction' as const,
          created_at: interaction.created_at,
          interaction,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [notes, interactions]
  )

  const currentStatusMeta = STATUS_META[owner.status]

  const handleAddNote = async () => {
    const trimmed = noteText.trim()
    if (!trimmed) return

    setSaving(true)
    try {
      await addNote(owner.id, trimmed, noteType)
      setNotes(prev => [
        {
          id: Date.now().toString(),
          owner_id: owner.id,
          note: trimmed,
          note_type: noteType,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      setNoteText('')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (status: OwnerStatus) => {
    if (owner.status === status) return

    const previousStatus = owner.status

    setSaving(true)
    try {
      await updateOwnerStatus(owner.id, status)
      setOwner(prev => ({ ...prev, status }))
      setNotes(prev => [
        {
          id: `status-${Date.now()}`,
          owner_id: owner.id,
          note: `Status changed from ${previousStatus} to ${status}`,
          note_type: 'general',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={embedded ? 'px-5 pb-6 pt-5' : 'mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-8 md:pt-8'}>
      <div className={`mb-6 flex items-center gap-3 ${embedded ? 'hidden' : ''}`}>
        <button
          onClick={() => {
            if (embedded) onClose?.()
            else router.back()
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#252825] bg-[#1A1D1A] text-[#8A918A] transition-colors hover:text-[#E8ECE8]"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#555D55]">Owner Profile</p>
          <h1 className="text-lg font-semibold text-[#E8ECE8] md:text-2xl">{owner.name ?? 'Owner details'}</h1>
        </div>
      </div>

      <div className={`grid gap-6 ${embedded ? 'xl:grid-cols-1' : 'xl:grid-cols-[minmax(0,1.5fr)_360px]'}`}>
        <section className="space-y-6">
          <div className="rounded-3xl border border-[#252825] bg-[linear-gradient(180deg,#1A1D1A_0%,#171916_100%)] p-5 md:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-start gap-4 md:gap-5">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-[#2E322E] bg-[#252825] md:h-20 md:w-20">
                  <span className="text-lg font-bold text-[#8A918A] md:text-2xl">{initials(owner.name)}</span>
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-[#E8ECE8] md:text-3xl">{owner.name ?? 'Unknown owner'}</h2>
                    <StatusBadge status={owner.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#8A918A]">
                    <span>{owner.unit_count} {owner.unit_count === 1 ? 'unit' : 'units'}</span>
                    <span>{timeline.length} timeline events</span>
                    <span className={confidenceColor(owner.confidence_score)}>
                      {owner.confidence_score != null ? `${owner.confidence_score}% confidence` : 'No confidence score'}
                    </span>
                  </div>
                  {possibleAgentMatches.length > 0 && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#5a4a1f] bg-[#2b2413] px-3 py-1.5 text-xs text-[#d7bd74]">
                      <ShieldCheck size={14} />
                      Possible internal agent match: {possibleAgentMatches.map(agent => agent.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-2 md:min-w-[260px]">
                <a
                  href={getCallUrl(owner.phone)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                    owner.phone
                      ? 'bg-[#C9A84C] text-[#0D0F0E]'
                      : 'pointer-events-none bg-[#252825] text-[#555D55]'
                  }`}
                >
                  <Phone size={16} />
                  {formatPhone(owner.phone) || 'No phone'}
                </a>
                {(owner.whatsapp || owner.phone) && (
                  <a
                    href={getWhatsAppUrl(owner.whatsapp ?? owner.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#1a4030] bg-[#0d2318] px-4 py-3 text-sm font-semibold text-[#4caf7d]"
                  >
                    <MessageCircle size={16} />
                    Open WhatsApp
                  </a>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#252825] bg-[#161816] p-4">
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-[#555D55]">Units Owned</div>
                <div className="flex flex-wrap gap-2">
                  {(owner.unit_numbers ?? []).length > 0 ? (
                    (owner.unit_numbers ?? []).map(unit => (
                      <span key={unit} className="rounded-lg bg-[#252825] px-2.5 py-1.5 text-xs font-medium text-[#C9A84C]">
                        {unit}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#8A918A]">No units recorded</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#252825] bg-[#161816] p-4">
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-[#555D55]">Communities</div>
                <div className="flex flex-wrap gap-2">
                  {(owner.sub_communities ?? []).length > 0 ? (
                    (owner.sub_communities ?? []).map(community => (
                      <span key={community} className="rounded-lg bg-[#252825] px-2.5 py-1.5 text-xs text-[#8A918A]">
                        {community}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#8A918A]">No communities recorded</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#252825] bg-[#1A1D1A] p-5 md:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#E8ECE8]">Activity Timeline</h3>
                <p className="text-sm text-[#555D55]">Every remark, status update, and legacy interaction in one chronological stream.</p>
              </div>
            </div>

            <div className="space-y-4">
              {timeline.map(item => {
                if (item.kind === 'note') {
                  const statusChange = getStatusChangeText(item.note)
                  const actor = getActorName(item.note.agent_id, agentMap)

                  return (
                    <div key={item.id} className="flex gap-3 md:gap-4">
                      <div className="flex w-10 flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2E322E] bg-[#161816] text-[#C9A84C]">
                          <FileText size={16} />
                        </div>
                        <div className="mt-2 h-full w-px bg-gradient-to-b from-[#252825] to-transparent" />
                      </div>

                      <div className="flex-1 rounded-2xl border border-[#252825] bg-[#161816] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[#E8ECE8]">{statusChange ? 'Status updated' : 'Remark added'}</span>
                          <span className="rounded-full bg-[#252825] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#8A918A]">
                            {statusChange ? 'status' : prettifyLabel(item.note.note_type)}
                          </span>
                        </div>
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#555D55]">
                          <span>{formatDateTime(item.created_at)}</span>
                          {actor && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1"><UserRound size={12} />{actor}</span>
                            </>
                          )}
                        </div>

                        {statusChange ? (
                          <p className="text-sm leading-relaxed text-[#E8ECE8]">
                            Changed from <span className="capitalize text-[#8A918A]">{statusChange.from}</span> to{' '}
                            <span className="capitalize text-[#C9A84C]">{statusChange.to}</span>
                          </p>
                        ) : (
                          <p className="text-sm leading-relaxed text-[#E8ECE8]">{item.note.note}</p>
                        )}
                      </div>
                    </div>
                  )
                }

                const actor = getActorName(item.interaction.agent_id, agentMap)

                return (
                  <div key={item.id} className="flex gap-3 md:gap-4">
                    <div className="flex w-10 flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2E322E] bg-[#161816] text-[#8A918A]">
                        <Phone size={16} />
                      </div>
                      <div className="mt-2 h-full w-px bg-gradient-to-b from-[#252825] to-transparent" />
                    </div>

                    <div className="flex-1 rounded-2xl border border-[#252825] bg-[#161816] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#E8ECE8]">Interaction logged</span>
                        <span className="rounded-full bg-[#252825] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#8A918A]">
                          {prettifyLabel(item.interaction.interaction_type)}
                        </span>
                      </div>
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#555D55]">
                        <span>{formatDateTime(item.created_at)}</span>
                        {actor && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1"><UserRound size={12} />{actor}</span>
                          </>
                        )}
                      </div>

                      <p className="text-sm leading-relaxed text-[#E8ECE8] capitalize">
                        {prettifyLabel(item.interaction.interaction_type)}
                        {item.interaction.outcome ? ` • ${prettifyLabel(item.interaction.outcome)}` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}

              {timeline.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#252825] bg-[#161816] px-4 py-10 text-center text-sm text-[#555D55]">
                  No history has been logged for this owner yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className={`space-y-6 ${embedded ? '' : 'xl:sticky xl:top-24 self-start'}`}>
          <div className="rounded-3xl border border-[#252825] bg-[#1A1D1A] p-5">
            <h3 className="mb-2 text-lg font-semibold text-[#E8ECE8]">Add remark</h3>
            <p className="mb-3 text-sm text-[#555D55]">Use this like your old remarks column. Keep the latest context here.</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {NOTE_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setNoteType(type.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    noteType === type.value
                      ? 'bg-[#C9A84C] text-[#0D0F0E]'
                      : 'border border-[#252825] bg-[#161816] text-[#8A918A]'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Example: Spoke with cousin, owner is abroad until next week, prefers WhatsApp follow-up."
              rows={6}
              className="mb-3 w-full resize-none rounded-2xl border border-[#252825] bg-[#161816] px-4 py-3 text-sm text-[#E8ECE8] outline-none placeholder:text-[#555D55] focus:border-[#C9A84C]"
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim() || saving}
              className="w-full rounded-xl bg-[#C9A84C] py-3 text-sm font-semibold text-[#0D0F0E] disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save remark'}
            </button>
          </div>

          <div className="rounded-3xl border border-[#252825] bg-[#1A1D1A] p-5">
            <h3 className="mb-2 text-lg font-semibold text-[#E8ECE8]">Current status</h3>
            <p className="mb-4 text-sm text-[#555D55]">Tap a status to update it. Changes are automatically added to the timeline.</p>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#555D55]">Current</span>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${currentStatusMeta.tone}`}>
                <CircleDot size={14} />
                {statusLabel(owner.status)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(status => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  disabled={saving}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
                    owner.status === status
                      ? 'border-[#C9A84C] bg-[#C9A84C] text-[#0D0F0E]'
                      : 'border-[#252825] bg-[#161816] text-[#8A918A] hover:border-[#3a3f3a] hover:text-[#E8ECE8]'
                  }`}
                >
                  <span>{statusLabel(status)}</span>
                  {owner.status === status && <span className="text-xs">Current</span>}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
