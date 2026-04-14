'use client'

import { useEffect, useState } from 'react'
import type { OwnerSummary, Note, Interaction } from '@/types'
import type { AgentLookup } from '@/services/owners'
import {
  getOwnerById,
  getOwnerNotes,
  getOwnerInteractions,
  getAgentProfilesByIds,
  getActiveAgents,
} from '@/services/owners'
import { OwnerProfileClient } from '@/app/owners/[id]/OwnerProfileClient'
import { X } from 'lucide-react'

interface OwnerDrawerState {
  owner: OwnerSummary
  notes: Note[]
  interactions: Interaction[]
  agents: AgentLookup[]
  activeAgents: AgentLookup[]
}

export function OwnerDrawer({
  ownerId,
  onClose,
}: {
  ownerId: string | null
  onClose: () => void
}) {
  const [data, setData] = useState<OwnerDrawerState | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!ownerId) return

    let active = true
    setLoading(true)
    setData(null)

    Promise.all([
      getOwnerById(ownerId),
      getOwnerNotes(ownerId),
      getOwnerInteractions(ownerId),
    ]).then(async ([owner, notes, interactions]) => {
      if (!active || !owner) return

      const agentIds = Array.from(
        new Set(
          [...notes.map(note => note.agent_id), ...interactions.map(interaction => interaction.agent_id)].filter(
            (value): value is string => Boolean(value)
          )
        )
      )

      const [agents, activeAgents] = await Promise.all([
        getAgentProfilesByIds(agentIds),
        getActiveAgents(),
      ])

      if (!active) return
      setData({ owner, notes, interactions, agents, activeAgents })
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [ownerId])

  useEffect(() => {
    if (!ownerId) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [ownerId])

  if (!ownerId) return null

  return (
    <div className="fixed inset-0 z-[70] hidden md:block">
      <button
        aria-label="Close owner drawer"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-[760px] border-l border-[#252825] bg-[#111311] shadow-2xl">
        <div className="h-full overflow-y-auto">
          {loading && (
            <div className="px-5 py-6 text-sm text-[#8A918A]">Loading owner details…</div>
          )}

          {!loading && data && (
            <>
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#252825] bg-[#111311] px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#555D55]">Owner Details</p>
                  <h2 className="text-lg font-semibold text-[#E8ECE8]">{data.owner.name ?? 'Owner details'}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#252825] bg-[#1A1D1A] text-[#8A918A] transition-colors hover:text-[#E8ECE8]"
                >
                  <X size={18} />
                </button>
              </div>

              <OwnerProfileClient
                owner={data.owner}
                initialNotes={data.notes}
                initialInteractions={data.interactions}
                agents={data.agents}
                activeAgents={data.activeAgents}
                embedded
                onClose={onClose}
              />
            </>
          )}

          {!loading && !data && (
            <div className="px-5 py-6 text-sm text-[#8A918A]">Unable to load owner details.</div>
          )}
        </div>
      </div>
    </div>
  )
}
