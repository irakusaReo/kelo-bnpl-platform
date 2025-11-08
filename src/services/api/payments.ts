// Payments service

import { apiClient } from './client';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
  MakePaymentRequest,
  GetPaymentsQuery,
  PaginatedResponse,
} from '@/types/api';

export class PaymentsService {
  private readonly basePath = '/payments';

  async makePayment(data: MakePaymentRequest): Promise<Payment> {
    const response = await apiClient.post<Payment>(this.basePath, data);
    return response.data;
  }

  async getPayments(query?: GetPaymentsQuery): Promise<PaginatedResponse<Payment>> {
    const params = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<Payment>>(
      `${this.basePath}?${params.toString()}`
    );
    return response.data;
  }

  async getPayment(paymentId: string): Promise<Payment> {
    const response = await apiClient.get<Payment>(`${this.basePath}/${paymentId}`);
    return response.data;
  }

  async getUserPayments(userId: string, query?: Omit<GetPaymentsQuery, 'userId'>): Promise<PaginatedResponse<Payment>> {
    const params = new URLSearchParams();
    params.append('userId', userId);
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<Payment>>(
      `${this.basePath}?${params.toString()}`
    );
    return response.data;
  }

  async getLoanPayments(loanId: string, query?: Omit<GetPaymentsQuery, 'loanId'>): Promise<PaginatedResponse<Payment>> {
    const params = new URLSearchParams();
    params.append('loanId', loanId);
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<Payment>>(
      `${this.basePath}?${params.toString()}`
    );
    return response.data;
  }

  async cancelPayment(paymentId: string, reason?: string): Promise<Payment> {
    const response = await apiClient.put<Payment>(`${this.basePath}/${paymentId}/cancel`, {
      reason,
    });
    return response.data;
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<Payment> {
    const response = await apiClient.post<Payment>(`${this.basePath}/${paymentId}/refund`, {
      amount,
      reason,
    });
    return response.data;
  }

  async getPaymentStats(filters?: {
    userId?: string;
    merchantId?: string;
    loanId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    averagePaymentAmount: number;
    byMethod: Record<PaymentMethod, {
      count: number;
      amount: number;
    }>;
    byStatus: Record<PaymentStatus, {
      count: number;
      amount: number;
    }>;
    byMonth: Array<{
      month: string;
      count: number;
      amount: number;
    }>;
  }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<any>(
      `${this.basePath}/stats?${params.toString()}`
    );
    return response.data;
  }

  async getPaymentMethods(): Promise<Array<{
    id: PaymentMethod;
    name: string;
    description: string;
    enabled: boolean;
    fees: {
      percentage: number;
      fixed: number;
    };
    limits: {
      min: number;
      max: number;
    };
    processingTime: string;
  }>> {
    const response = await apiClient.get<any>(`${this.basePath}/methods`);
    return response.data;
  }

  async initiateMpesaPayment(data: {
    phoneNumber: string;
    amount: number;
    loanId: string;
    callbackUrl?: string;
  }): Promise<{
    checkoutRequestId: string;
    merchantRequestId: string;
    responseCode: string;
    responseDescription: string;
    customerMessage: string;
  }> {
    const response = await apiClient.post<any>(`${this.basePath}/mpesa/initiate`, data);
    return response.data;
  }

  async confirmMpesaPayment(checkoutRequestId: string): Promise<{
    success: boolean;
    paymentId?: string;
    error?: string;
  }> {
    const response = await apiClient.post<any>(`${this.basePath}/mpesa/confirm`, {
      checkoutRequestId,
    });
    return response.data;
  }

  async initiateBankTransfer(data: {
    accountNumber: string;
    bankCode: string;
    amount: number;
    loanId: string;
    accountName?: string;
  }): Promise<{
    transactionId: string;
    status: string;
    message: string;
  }> {
    const response = await apiClient.post<any>(`${this.basePath}/bank/initiate`, data);
    return response.data;
  }

  async initiateCryptoPayment(data: {
    amount: number;
    currency: string;
    loanId: string;
    walletAddress: string;
  }): Promise<{
    transactionId: string;
    depositAddress: string;
    expectedAmount: number;
    qrCode?: string;
    expiresAt: string;
  }> {
    const response = await apiClient.post<any>(`${this.basePath}/crypto/initiate`, data);
    return response.data;
  }

  async initiateCardPayment(data: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    amount: number;
    loanId: string;
    cardholderName: string;
  }): Promise<{
    transactionId: string;
    status: string;
    message: string;
    requires3DS: boolean;
    redirectUrl?: string;
  }> {
    const response = await apiClient.post<any>(`${this.basePath}/card/initiate`, data);
    return response.data;
  }

  async getPaymentReceipt(paymentId: string): Promise<{
    id: string;
    paymentId: string;
    receiptNumber: string;
    amount: number;
    currency: string;
    date: string;
    paymentMethod: string;
    status: string;
    borrower: {
      name: string;
      email: string;
      phone: string;
    };
    loan: {
      loanId: string;
      amount: number;
      description: string;
    };
    breakdown: Array<{
      label: string;
      value: number;
    }>;
  }> {
    const response = await apiClient.get<any>(`${this.basePath}/${paymentId}/receipt`);
    return response.data;
  }

  async downloadPaymentReceipt(paymentId: string, format: 'pdf' | 'html' = 'pdf'): Promise<Blob> {
    const response = await apiClient.get(
      `${this.basePath}/${paymentId}/receipt/download?format=${format}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  async exportPayments(query?: GetPaymentsQuery, format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get(
      `${this.basePath}/export?${params.toString()}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  async getPaymentSchedule(loanId: string): Promise<Array<{
    id: string;
    dueDate: string;
    amount: number;
    principal: number;
    interest: number;
    status: 'pending' | 'paid' | 'overdue';
    paidAmount?: number;
    paidAt?: string;
    lateFee?: number;
  }>> {
    const response = await apiClient.get<any>(`${this.basePath}/schedule/${loanId}`);
    return response.data;
  }

  async calculateEarlySettlement(loanId: string): Promise<{
    outstandingPrincipal: number;
    outstandingInterest: number;
    earlySettlementFee: number;
    totalAmount: number;
    savings: number;
    breakdown: Array<{
      label: string;
      value: number;
    }>;
  }> {
    const response = await apiClient.get<any>(`${this.basePath}/early-settlement/${loanId}`);
    return response.data;
  }

  async processEarlySettlement(loanId: string, paymentMethod: PaymentMethod): Promise<Payment> {
    const response = await apiClient.post<Payment>(`${this.basePath}/early-settlement/${loanId}`, {
      paymentMethod,
    });
    return response.data;
  }

  // Admin-specific methods
  async getPendingPayments(query?: Omit<GetPaymentsQuery, 'status'>): Promise<PaginatedResponse<Payment>> {
    return this.getPayments({
      ...query,
      status: 'pending',
    });
  }

  async getFailedPayments(query?: Omit<GetPaymentsQuery, 'status'>): Promise<PaginatedResponse<Payment>> {
    return this.getPayments({
      ...query,
      status: 'failed',
    });
  }

  async retryFailedPayment(paymentId: string): Promise<Payment> {
    const response = await apiClient.post<Payment>(`${this.basePath}/${paymentId}/retry`);
    return response.data;
  }

  async bulkProcessPayments(
    paymentIds: string[],
    action: 'approve' | 'reject' | 'retry'
  ): Promise<Array<{
    paymentId: string;
    success: boolean;
    error?: string;
  }>> {
    const response = await apiClient.put<any>(`${this.basePath}/bulk-process`, {
      paymentIds,
      action,
    });
    return response.data;
  }
}

// Export singleton instance
export const paymentsService = new PaymentsService();
