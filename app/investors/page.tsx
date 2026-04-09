import { InvestorsClient } from './InvestorsClient'
import { PageHeader } from '@/components/layout/PageHeader'

export default function InvestorsPage() {
  return (
    <div>
      <PageHeader title="Investors" subtitle="Owners with 2+ units" />
      <InvestorsClient />
    </div>
  )
}
