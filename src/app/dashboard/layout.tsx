import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-bold">Kelo Dashboard</h2>
          </div>
          <nav className="mt-6">
            <div className="px-4 space-y-2">
              <a
                href="/dashboard"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Overview
              </a>
              <a
                href="/dashboard/loans"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                My Loans
              </a>
              <a
                href="/dashboard/staking"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Staking
              </a>
              <a
                href="/dashboard/payments"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Payments
              </a>
              <a
                href="/dashboard/wallet"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Wallet
              </a>
              <a
                href="/dashboard/profile"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Profile
              </a>
              <a
                href="/dashboard/settings"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Settings
              </a>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}