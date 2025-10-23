
import PageHeader from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Shopping Cart"
        description="Review your items before checkout."
      />
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Under Construction</AlertTitle>
        <AlertDescription>
          This feature is currently under development. Check back soon for updates!
        </AlertDescription>
      </Alert>
    </div>
  );
}
