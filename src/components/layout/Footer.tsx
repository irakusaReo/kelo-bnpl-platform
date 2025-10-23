
export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container py-8 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Kelo. All rights reserved.
        </p>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
            Privacy Policy
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
