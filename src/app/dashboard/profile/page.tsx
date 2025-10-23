
import PageHeader from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        title="My Profile"
        description="View and manage your personal information."
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
