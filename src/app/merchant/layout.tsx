import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/config";

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(getAuthOptions());

  if (!session || session.user.role !== "merchant") {
    redirect("/auth/merchant-login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Merchant Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-bold">Merchant Portal</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kelo for Business</p>
          </div>
          <nav className="mt-6">
            <div className="px-4 space-y-2">
              <a
                href="/merchant/dashboard"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Dashboard
              </a>
              <a
                href="/merchant/analytics"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Analytics
              </a>
              <a
                href="/merchant/customers"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Customers
              </a>
              <a
                href="/merchant/loans"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Loan Applications
              </a>
              <a
                href="/merchant/payments"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Payments
              </a>
              <a
                href="/merchant/qr-codes"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                QR Codes
              </a>
              <a
                href="/merchant/pay-with-kelo"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Pay with Kelo
              </a>
              <a
                href="/merchant/integrations"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Integrations
              </a>
              <a
                href="/merchant/staking"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Staking
              </a>
              <a
                href="/merchant/settings"
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