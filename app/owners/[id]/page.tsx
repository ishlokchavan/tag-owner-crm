import { notFound } from 'next/navigation'
import { getOwnerById, getOwnerNotes, getOwnerInteractions } from '@/services/owners'
import { OwnerProfileClient } from './OwnerProfileClient'

export default async function OwnerProfilePage({ params }: { params: { id: string } }) {
  const [owner, notes, interactions] = await Promise.all([
    getOwnerById(params.id),
    getOwnerNotes(params.id),
    getOwnerInteractions(params.id),
  ])
  if (!owner) notFound()
  return <OwnerProfileClient owner={owner} initialNotes={notes} initialInteractions={interactions} />
}
