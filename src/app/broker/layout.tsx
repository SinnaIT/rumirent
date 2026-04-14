import { WorkspaceLayout } from '@/components/layout/workspace-layout'

export default function BrokerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WorkspaceLayout allowedRoles={['BROKER', 'TEAM_LEADER']}>
      {children}
    </WorkspaceLayout>
  )
}
