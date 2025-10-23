
import Link from 'next/link'

export default function AuthLayout({
  children,
  title,
  description,
}: {
  children: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center space-x-2 mb-4">
               <div className="h-12 w-12 rounded-full bg-primary" />
               <span className="text-3xl font-bold">Kelo</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
