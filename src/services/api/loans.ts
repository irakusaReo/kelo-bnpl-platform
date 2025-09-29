import apiClient from "./client";

export interface LoanApplication {
  id: string;
  amount: number;
  duration: number;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "active" | "completed" | "defaulted";
  createdAt: string;
  updatedAt: string;
  merchantId: string;
  customerId: string;
}

export interface CreateLoanRequest {
  amount: number;
  duration: number;
  purpose: string;
  merchantId: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "pending" | "paid" | "overdue";
}

export const loansService = {
  // Get all loans for current user
  async getLoans(): Promise<LoanApplication[]> {
    const response = await apiClient.get("/loans");
    return response.data;
  },

  // Get single loan by ID
  async getLoan(id: string): Promise<LoanApplication> {
    const response = await apiClient.get(`/loans/${id}`);
    return response.data;
  },

  // Create new loan application
  async applyForLoan(data: CreateLoanRequest): Promise<LoanApplication> {
    const response = await apiClient.post("/loans", data);
    return response.data;
  },

  // Get loan payments
  async getLoanPayments(loanId: string): Promise<LoanPayment[]> {
    const response = await apiClient.get(`/loans/${loanId}/payments`);
    return response.data;
  },

  // Make payment
  async makePayment(loanId: string, amount: number): Promise<LoanPayment> {
    const response = await apiClient.post(`/loans/${loanId}/payments`, { amount });
    return response.data;
  },

  // Get loan eligibility
  async getEligibility(): Promise<{
    maxAmount: number;
    interestRate: number;
    creditScore: number;
  }> {
    const response = await apiClient.get("/loans/eligibility");
    return response.data;
  },
};