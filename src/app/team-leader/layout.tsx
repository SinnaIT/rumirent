import { WorkspaceLayout } from '@/components/layout/workspace-layout'

export default function TeamLeaderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WorkspaceLayout allowedRoles={['TEAM_LEADER']}>
      {children}
    </WorkspaceLayout>
  )
}
