import { OwnersClient } from './OwnersClient'
import { PageHeader } from '@/components/layout/PageHeader'
import { getSubCommunities } from '@/services/properties'

export default async function OwnersPage({ searchParams }: { searchParams: { sub?: string; q?: string } }) {
  const subCommunities = await getSubCommunities()
  return (
    <div>
      <PageHeader title="Owners" />
      <OwnersClient
        subCommunities={subCommunities.map(s => s.name)}
        initialSub={searchParams.sub ?? ''}
        initialSearch={searchParams.q ?? ''}
      />
    </div>
  )
}
