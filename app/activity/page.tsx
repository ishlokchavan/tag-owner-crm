import { getAgentActivity, getTeamActivity, TeamAgentRow } from '@/services/prospecting'
import { PageHeader } from '@/components/layout/PageHeader'
import { ActivityClient } from './ActivityClient'
import { createClient } from '@/lib/supabase-server'

export const revalidate = 0

export default async function ActivityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('agent_profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  const [activity, team] = await Promise.all([
    getAgentActivity(),
    isAdmin ? getTeamActivity() : Promise.resolve([] as TeamAgentRow[]),
  ])

  return (
    <div>
      <PageHeader title="Activity" subtitle={isAdmin ? 'Team overview' : 'Your call performance'} />
      <ActivityClient activity={activity} team={isAdmin ? team : []} isAdmin={isAdmin} />
    </div>
  )
}
