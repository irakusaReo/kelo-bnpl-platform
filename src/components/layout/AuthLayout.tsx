import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center justify-center rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm font-medium text-slate-900 hover:border-slate-200 hover:bg-slate-100 focus:z-10 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-800"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Home
      </Link>
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">{title}</h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
