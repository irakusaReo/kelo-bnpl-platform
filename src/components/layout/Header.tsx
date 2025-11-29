import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className="header">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold">
              Kelo
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="hover:text-primary">
                Dashboard
              </Link>
              <Link href="/merchant" className="hover:text-primary">
                For Merchants
              </Link>
              <Link href="/about" className="hover:text-primary">
                About
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}