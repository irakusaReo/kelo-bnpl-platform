"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoanApplicationsTable } from "@/components/tables/loan-applications-table";
import { StatsCard } from "@/components/ui/stats-card";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Users,
  AlertTriangle,
  Eye,
  Download
} from "lucide-react";
import { useSocket } from "@/lib/socket/socket-provider";
import { toast } from "sonner";

interface LoanApplication {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  purpose: string;
  term: number;
  status: "pending" | "approved" | "rejected" | "under_review";
  creditScore: number;
  monthlyIncome: number;
  employmentStatus: string;
  appliedAt: Date;
  lastUpdated: Date;
  documents?: Array<{
    type: string;
    name: string;
    status: "verified" | "pending" | "rejected";
  }>;
}

// Mock data for demonstration
const mockApplications: LoanApplication[] = [
  {
    id: "APP-001",
    customerName: "John Doe",
    customerEmail: "john.doe@email.com",
    customerPhone: "+254 712 345 678",
    amount: 45000,
    purpose: "Electronics",
    term: 6,
    status: "pending",
    creditScore: 720,
    monthlyIncome: 85000,
    employmentStatus: "Employed",
    appliedAt: new Date("2024-01-15T10:30:00"),
    lastUpdated: new Date("2024-01-15T10:30:00"),
    documents: [
      { type: "ID", name: "National ID.pdf", status: "verified" },
      { type: "Payslip", name: "December_Payslip.pdf", status: "verified" },
      { type: "Bank Statement", name: "Bank_Statement.pdf", status: "pending" }
    ]
  },
  {
    id: "APP-002",
    customerName: "Jane Smith",
    customerEmail: "jane.smith@email.com",
    customerPhone: "+254 723 456 789",
    amount: 25000,
    purpose: "Furniture",
    term: 4,
    status: "approved",
    creditScore: 680,
    monthlyIncome: 65000,
    employmentStatus: "Self-employed",
    appliedAt: new Date("2024-01-14T14:20:00"),
    lastUpdated: new Date("2024-01-15T09:15:00"),
    documents: [
      { type: "ID", name: "National_ID.pdf", status: "verified" },
      { type: "Payslip", name: "Income_Proof.pdf", status: "verified" },
      { type: "Bank Statement", name: "Bank_Statement.pdf", status: "verified" }
    ]
  },
  {
    id: "APP-003",
    customerName: "Mike Johnson",
    customerEmail: "mike.johnson@email.com",
    customerPhone: "+254 734 567 890",
    amount: 15000,
    purpose: "Clothing",
    term: 3,
    status: "rejected",
    creditScore: 520,
    monthlyIncome: 35000,
    employmentStatus: "Unemployed",
    appliedAt: new Date("2024-01-13T16:45:00"),
    lastUpdated: new Date("2024-01-14T11:30:00"),
    documents: [
      { type: "ID", name: "ID_Card.pdf", status: "verified" },
      { type: "Payslip", name: "Income_Proof.pdf", status: "rejected" }
    ]
  },
  {
    id: "APP-004",
    customerName: "Sarah Williams",
    customerEmail: "sarah.williams@email.com",
    customerPhone: "+254 745 678 901",
    amount: 35000,
    purpose: "Home Appliances",
    term: 5,
    status: "under_review",
    creditScore: 650,
    monthlyIncome: 55000,
    employmentStatus: "Employed",
    appliedAt: new Date("2024-01-16T09:00:00"),
    lastUpdated: new Date("2024-01-16T09:00:00"),
    documents: [
      { type: "ID", name: "National_ID.pdf", status: "verified" },
      { type: "Payslip", name: "January_Payslip.pdf", status: "pending" },
      { type: "Bank Statement", name: "Bank_Statement.pdf", status: "pending" }
    ]
  },
  {
    id: "APP-005",
    customerName: "David Brown",
    customerEmail: "david.brown@email.com",
    customerPhone: "+254 756 789 012",
    amount: 60000,
    purpose: "Electronics",
    term: 8,
    status: "pending",
    creditScore: 750,
    monthlyIncome: 95000,
    employmentStatus: "Employed",
    appliedAt: new Date("2024-01-16T11:30:00"),
    lastUpdated: new Date("2024-01-16T11:30:00"),
    documents: [
      { type: "ID", name: "ID_Document.pdf", status: "verified" },
      { type: "Payslip", name: "Salary_Slip.pdf", status: "verified" },
      { type: "Bank Statement", name: "Bank_Statement.pdf", status: "verified" }
    ]
  }
];

export default function MerchantLoansPage() {
  const [applications, setApplications] = useState<LoanApplication[]>(mockApplications);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalLoanAmount: 0,
    averageCreditScore: 0,
  });
  const { isConnected, lastMessage } = useSocket();

  useEffect(() => {
    // Calculate stats
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === "pending").length;
    const approvedApplications = applications.filter(app => app.status === "approved").length;
    const rejectedApplications = applications.filter(app => app.status === "rejected").length;
    const totalLoanAmount = applications.reduce((sum, app) => sum + app.amount, 0);
    const averageCreditScore = applications.reduce((sum, app) => sum + app.creditScore, 0) / totalApplications;

    setStats({
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalLoanAmount,
      averageCreditScore: Math.round(averageCreditScore),
    });
  }, [applications]);

  useEffect(() => {
    // Handle real-time socket messages
    if (lastMessage) {
      console.log("Received socket message:", lastMessage);
      if (lastMessage.type === "new_application") {
        setApplications(prev => [lastMessage.data, ...prev]);
        toast.success("New loan application received!");
      }
    }
  }, [lastMessage]);

  const handleApprove = (applicationId: string) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: "approved" as const, lastUpdated: new Date() }
          : app
      )
    );
    toast.success("Loan application approved successfully!");
  };

  const handleReject = (applicationId: string, reason: string) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: "rejected" as const, lastUpdated: new Date() }
          : app
      )
    );
    toast.success("Loan application rejected!");
  };

  const handleViewDetails = (application: LoanApplication) => {
    console.log("View details for application:", application);
  };

  const pendingApplications = applications.filter(app => app.status === "pending");
  const approvedApplications = applications.filter(app => app.status === "approved");
  const rejectedApplications = applications.filter(app => app.status === "rejected");

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Loan Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and review loan applications from your customers
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Real-time updates active' : 'Real-time updates disconnected'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Applications"
          value={stats.totalApplications}
          description="All time applications"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Pending Review"
          value={stats.pendingApplications}
          description="Awaiting approval"
          trend={{
            value: stats.pendingApplications > 0 ? 12.5 : 0,
            label: "from yesterday",
            type: stats.pendingApplications > 0 ? "up" : "neutral"
          }}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Approved Loans"
          value={stats.approvedApplications}
          description="Successfully approved"
          trend={{
            value: 8.3,
            label: "approval rate",
            type: "up"
          }}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Avg. Credit Score"
          value={stats.averageCreditScore}
          description="Across all applications"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All Applications ({stats.totalApplications})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({stats.pendingApplications})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({stats.approvedApplications})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({stats.rejectedApplications})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <LoanApplicationsTable
            applications={applications}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="pending">
          <LoanApplicationsTable
            applications={pendingApplications}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="approved">
          <LoanApplicationsTable
            applications={approvedApplications}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="rejected">
          <LoanApplicationsTable
            applications={rejectedApplications}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              High Priority Applications
            </CardTitle>
            <CardDescription>
              Applications requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingApplications.slice(0, 3).map(app => (
                <div key={app.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{app.customerName}</p>
                    <p className="text-sm text-gray-500">KES {app.amount.toLocaleString()}</p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Approval Trends
            </CardTitle>
            <CardDescription>
              Weekly approval statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">This Week</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Last Week</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Average</span>
                <span className="font-medium">82%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Top Customers
            </CardTitle>
            <CardDescription>
              Most active loan applicants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {approvedApplications.slice(0, 3).map(app => (
                <div key={app.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{app.customerName}</p>
                    <p className="text-sm text-gray-500">{app.purpose}</p>
                  </div>
                  <Badge variant="default">Approved</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}