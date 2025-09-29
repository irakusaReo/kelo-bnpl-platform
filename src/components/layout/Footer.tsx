import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Kelo</h3>
            <p className="text-muted-foreground">
              Buy Now, Pay Later platform for Kenya and beyond.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/integrations" className="hover:text-foreground">Integrations</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
              <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Legal</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-foreground">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
          <p>&copy; 2024 Kelo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}