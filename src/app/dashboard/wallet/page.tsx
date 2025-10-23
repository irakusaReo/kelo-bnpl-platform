
import PageHeader from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function WalletPage() {
  return (
    <>
      <PageHeader
        title="My Wallet"
        description="Manage your connected wallets and view your balances."
      />
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Under Construction</AlertTitle>
        <AlertDescription>
          This feature is currently under development. Check back soon for updates!
        </AlertDescription>
      </Alert>
    </>
  );
}
