import { UserManagement } from './components'

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      <p className="text-muted-foreground">
        View and manage all platform users.
      </p>
      <UserManagement />
    </div>
  )
}
