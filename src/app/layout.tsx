
import { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ThemeProvider } from "@/contexts/theme-context";
import { UserProvider } from "@/contexts/UserContext";
import { SocketProvider } from "@/lib/socket/socket-provider";
import { Web3Provider } from "@/contexts/Web3Provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kelo - BNPL Platform for Kenya",
  description: "Modern Buy Now Pay Later platform designed for the Kenyan market with multi-chain support and AI-powered credit scoring.",
  keywords: ["BNPL", "Kenya", "Fintech", "Cryptocurrency", "Blockchain", "Hedera", "Ethereum", "Loans"],
  authors: [{ name: "Kelo Team" }],
  openGraph: {
    title: "Kelo - BNPL Platform",
    description: "Modern BNPL platform for Kenya with blockchain integration",
    url: "https://kelo.finance",
    siteName: "Kelo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kelo - BNPL Platform",
    description: "Modern BNPL platform for Kenya with blockchain integration",
  },
};

export function generateViewport() {
  return {
    viewport: "width=device-width, initial-scale=1",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Web3Provider>
            <AuthProvider>
                <UserProvider>
                  <SocketProvider>
                    {children}
                    <Toaster />
                  </SocketProvider>
                </UserProvider>
            </AuthProvider>
          </Web3Provider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
