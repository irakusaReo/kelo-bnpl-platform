"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  Download,
  MoreHorizontal,
  User,
  CreditCard,
  Calendar,
  Phone,
  Mail
} from "lucide-react";
import { format } from "date-fns";

interface LoanApplication {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  purpose: string;
  term: number; // in months
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

interface LoanApplicationsTableProps {
  applications: LoanApplication[];
  onApprove?: (applicationId: string) => void;
  onReject?: (applicationId: string, reason: string) => void;
  onViewDetails?: (application: LoanApplication) => void;
}

export function LoanApplicationsTable({ 
  applications, 
  onApprove, 
  onReject, 
  onViewDetails 
}: LoanApplicationsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: LoanApplication["status"]) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      under_review: "outline"
    } as const;

    const labels = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      under_review: "Under Review"
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 700) return "text-green-600";
    if (score >= 600) return "text-yellow-600";
    return "text-red-600";
  };

  const ApplicationDetailsDialog = ({ application }: { application: LoanApplication }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Loan Application Details</DialogTitle>
          <DialogDescription>
            Application ID: {application.id}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{application.customerName}</p>
                    <p className="text-sm text-gray-500">{application.customerEmail}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <p className="text-sm">{application.customerPhone}</p>
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Loan Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">{formatCurrency(application.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Term</p>
                  <p className="font-medium">{application.term} months</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Purpose</p>
                  <p className="font-medium">{application.purpose}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credit Score</p>
                  <p className={`font-medium ${getCreditScoreColor(application.creditScore)}`}>
                    {application.creditScore}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Financial Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Monthly Income</p>
                  <p className="font-medium">{formatCurrency(application.monthlyIncome)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employment Status</p>
                  <p className="font-medium">{application.employmentStatus}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            {application.documents && application.documents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Documents</h3>
                <div className="space-y-2">
                  {application.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.type}</p>
                      </div>
                      <Badge variant={doc.status === "verified" ? "default" : doc.status === "pending" ? "secondary" : "destructive"}>
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Timeline</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm">Applied</p>
                    <p className="text-xs text-gray-500">{format(application.appliedAt, "PPP p")}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm">Last Updated</p>
                    <p className="text-xs text-gray-500">{format(application.lastUpdated, "PPP p")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              {application.status === "pending" && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => onReject?.(application.id, "Rejected by merchant")}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    onClick={() => onApprove?.(application.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Loan Applications</CardTitle>
            <CardDescription>
              Manage and review loan applications from your customers
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Credit Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{application.customerName}</p>
                      <p className="text-sm text-gray-500">{application.customerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(application.amount)}
                  </TableCell>
                  <TableCell>{application.purpose}</TableCell>
                  <TableCell>{application.term} months</TableCell>
                  <TableCell>
                    <span className={`font-medium ${getCreditScoreColor(application.creditScore)}`}>
                      {application.creditScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(application.status)}
                  </TableCell>
                  <TableCell>
                    {format(application.appliedAt, "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <ApplicationDetailsDialog application={application} />
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredApplications.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No loan applications found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}