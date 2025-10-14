import { MerchantManagement } from './components'

export default function AdminMerchantsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Merchant Management</h1>
      <p className="text-muted-foreground">
        View and manage all platform merchants.
      </p>
      <MerchantManagement />
    </div>
  )
}
