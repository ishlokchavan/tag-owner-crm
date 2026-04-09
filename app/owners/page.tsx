import { OwnersClient } from './OwnersClient'
import { PageHeader } from '@/components/layout/PageHeader'
import { getSubCommunities } from '@/services/properties'

export default async function OwnersPage({ searchParams }: { searchParams: { sub?: string } }) {
  const subCommunities = await getSubCommunities()
  const initialSub = searchParams.sub ?? ''
  return (
    <div>
      <PageHeader title="Owners" subtitle="6,945 records" />
      <OwnersClient subCommunities={subCommunities.map(s => s.name)} initialSub={initialSub} />
    </div>
  )
}
