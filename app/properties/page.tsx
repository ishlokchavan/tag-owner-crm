import { PropertiesClient } from './PropertiesClient'
import { PageHeader } from '@/components/layout/PageHeader'
import { getSubCommunities } from '@/services/properties'

export default async function PropertiesPage() {
  const subCommunities = await getSubCommunities()
  return (
    <div>
      <PageHeader title="Properties" subtitle="1,288 units" />
      <PropertiesClient subCommunities={subCommunities.map(s => s.name)} />
    </div>
  )
}
