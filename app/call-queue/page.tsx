import { CallQueueClient } from './CallQueueClient'
import { PageHeader } from '@/components/layout/PageHeader'

export default function CallQueuePage() {
  return (
    <div>
      <PageHeader title="Call Queue" subtitle="Daily prospecting mode" />
      <CallQueueClient />
    </div>
  )
}
