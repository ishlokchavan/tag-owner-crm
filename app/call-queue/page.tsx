import { CallQueueClient } from './CallQueueClient'
import { PageHeader } from '@/components/layout/PageHeader'

export default function CallQueuePage() {
  return (
    <div>
      <PageHeader title="Daily Prospecting" subtitle="Elan · 100 calls/day" />
      <CallQueueClient />
    </div>
  )
}
