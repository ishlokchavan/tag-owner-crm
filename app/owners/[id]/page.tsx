import { notFound } from 'next/navigation'
import { getOwnerById, getOwnerNotes, getOwnerInteractions, getAgentProfilesByIds, getActiveAgents } from '@/services/owners'
import { OwnerProfileClient } from './OwnerProfileClient'

export default async function OwnerProfilePage({ params }: { params: { id: string } }) {
  const [owner, notes, interactions] = await Promise.all([
    getOwnerById(params.id),
    getOwnerNotes(params.id),
    getOwnerInteractions(params.id),
  ])
  if (!owner) notFound()

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

  return (
    <OwnerProfileClient
      owner={owner}
      initialNotes={notes}
      initialInteractions={interactions}
      agents={agents}
      activeAgents={activeAgents}
    />
  )
}
