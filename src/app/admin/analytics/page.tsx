import { AnalyticsDashboard } from './components'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
      <p className="text-muted-foreground">
        View platform-wide analytics and key metrics.
      </p>
      <AnalyticsDashboard />
    </div>
  )
}
