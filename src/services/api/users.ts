// Users service

import { apiClient } from './client';
import {
  User,
  UserRole,
  UserStatus,
  GetUsersQuery,
  PaginatedResponse,
  CreateMerchantRequest,
  UpdateMerchantRequest,
  Merchant,
  MerchantStatus,
  VerifyMerchantRequest,
} from '@/types/api';

export class UsersService {
  private readonly basePath = '/users';

  async getUsers(query?: GetUsersQuery): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<User>>(
      `${this.basePath}?${params.toString()}`
    );
    return response.data;
  }

  async getUser(userId: string): Promise<User> {
    const response = await apiClient.get<User>(`${this.basePath}/${userId}`);
    return response.data;
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`${this.basePath}/${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${userId}`);
  }

  async activateUser(userId: string): Promise<User> {
    const response = await apiClient.put<User>(`${this.basePath}/${userId}/activate`);
    return response.data;
  }

  async deactivateUser(userId: string, reason?: string): Promise<User> {
    const response = await apiClient.put<User>(`${this.basePath}/${userId}/deactivate`, {
      reason,
    });
    return response.data;
  }

  async suspendUser(userId: string, reason?: string, duration?: number): Promise<User> {
    const response = await apiClient.put<User>(`${this.basePath}/${userId}/suspend`, {
      reason,
      duration,
    });
    return response.data;
  }

  async getUserStats(filters?: {
    role?: UserRole;
    status?: UserStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalUsers: number;
    activeUsers: number;
    byRole: Record<UserRole, number>;
    byStatus: Record<UserStatus, number>;
    byMonth: Array<{
      month: string;
      total: number;
      active: number;
    }>;
    recentActivity: Array<{
      date: string;
      registrations: number;
      logins: number;
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

  async getUserActivity(userId: string, limit?: number): Promise<Array<{
    id: string;
    action: string;
    resource: string;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }>> {
    const params = new URLSearchParams();
    if (limit) {
      params.append('limit', String(limit));
    }

    const response = await apiClient.get<any>(
      `${this.basePath}/${userId}/activity?${params.toString()}`
    );
    return response.data;
  }

  async getUserSessions(userId: string): Promise<Array<{
    id: string;
    device: string;
    browser: string;
    os: string;
    ipAddress: string;
    location: string;
    lastActive: string;
    isActive: boolean;
  }>> {
    const response = await apiClient.get<any>(`${this.basePath}/${userId}/sessions`);
    return response.data;
  }

  async terminateUserSession(userId: string, sessionId: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${userId}/sessions/${sessionId}`);
  }

  async terminateAllUserSessions(userId: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${userId}/sessions`);
  }

  // Merchant-specific methods
  async getMerchants(query?: {
    page?: number;
    limit?: number;
    status?: MerchantStatus;
    verified?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Merchant>> {
    const params = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<Merchant>>(
      `${this.basePath}/merchants?${params.toString()}`
    );
    return response.data;
  }

  async getMerchant(merchantId: string): Promise<Merchant> {
    const response = await apiClient.get<Merchant>(`${this.basePath}/merchants/${merchantId}`);
    return response.data;
  }

  async createMerchant(data: CreateMerchantRequest): Promise<Merchant> {
    const response = await apiClient.post<Merchant>(`${this.basePath}/merchants`, data);
    return response.data;
  }

  async updateMerchant(merchantId: string, data: UpdateMerchantRequest): Promise<Merchant> {
    const response = await apiClient.put<Merchant>(`${this.basePath}/merchants/${merchantId}`, data);
    return response.data;
  }

  async deleteMerchant(merchantId: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/merchants/${merchantId}`);
  }

  async verifyMerchant(data: VerifyMerchantRequest): Promise<Merchant> {
    const response = await apiClient.put<Merchant>(
      `${this.basePath}/merchants/${data.merchantId}/verify`,
      {
        status: data.status,
        notes: data.notes,
      }
    );
    return response.data;
  }

  async getMerchantStats(merchantId: string): Promise<{
    totalLoans: number;
    activeLoans: number;
    totalAmount: number;
    repaidAmount: number;
    averageLoanSize: number;
    defaultRate: number;
    monthlyVolume: Array<{
      month: string;
      count: number;
      amount: number;
    }>;
  }> {
    const response = await apiClient.get<any>(`${this.basePath}/merchants/${merchantId}/stats`);
    return response.data;
  }

  async getMerchantDocuments(merchantId: string): Promise<Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt?: string;
    rejectedReason?: string;
  }>> {
    const response = await apiClient.get<any>(`${this.basePath}/merchants/${merchantId}/documents`);
    return response.data;
  }

  async uploadMerchantDocument(
    merchantId: string,
    file: File,
    type: string,
    name?: string
  ): Promise<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
    status: 'pending' | 'verified' | 'rejected';
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (name) {
      formData.append('name', name);
    }

    const response = await apiClient.post<any>(
      `${this.basePath}/merchants/${merchantId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async verifyMerchantDocument(
    merchantId: string,
    documentId: string,
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<void> {
    await apiClient.put(`${this.basePath}/merchants/${merchantId}/documents/${documentId}`, {
      status,
      reason,
    });
  }

  async getMerchantSettings(merchantId: string): Promise<{
    autoApproval: boolean;
    maxLoanAmount: number;
    interestRateRange: {
      min: number;
      max: number;
    };
    durationRange: {
      min: number;
      max: number;
    };
    supportedCurrencies: string[];
    paymentMethods: string[];
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  }> {
    const response = await apiClient.get<any>(`${this.basePath}/merchants/${merchantId}/settings`);
    return response.data;
  }

  async updateMerchantSettings(
    merchantId: string,
    settings: {
      autoApproval?: boolean;
      maxLoanAmount?: number;
      interestRateRange?: {
        min: number;
        max: number;
      };
      durationRange?: {
        min: number;
        max: number;
      };
      supportedCurrencies?: string[];
      paymentMethods?: string[];
      notifications?: {
        email?: boolean;
        sms?: boolean;
        push?: boolean;
      };
    }
  ): Promise<void> {
    await apiClient.put(`${this.basePath}/merchants/${merchantId}/settings`, settings);
  }

  // KYC verification
  async initiateKycVerification(userId: string): Promise<{
    verificationId: string;
    status: string;
    requirements: Array<{
      type: string;
      description: string;
      required: boolean;
    }>;
  }> {
    const response = await apiClient.post<any>(`${this.basePath}/${userId}/kyc/initiate`);
    return response.data;
  }

  async submitKycDocuments(
    userId: string,
    verificationId: string,
    documents: Array<{
      type: string;
      file: File;
      data?: Record<string, any>;
    }>
  ): Promise<{
    verificationId: string;
    status: string;
    message: string;
  }> {
    const formData = new FormData();
    
    documents.forEach((doc, index) => {
      formData.append(`documents[${index}].type`, doc.type);
      formData.append(`documents[${index}].file`, doc.file);
      if (doc.data) {
        formData.append(`documents[${index}].data`, JSON.stringify(doc.data));
      }
    });

    const response = await apiClient.post<any>(
      `${this.basePath}/${userId}/kyc/${verificationId}/submit`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async getKycVerificationStatus(userId: string): Promise<{
    verificationId: string;
    status: 'pending' | 'under_review' | 'approved' | 'rejected';
    submittedAt?: string;
    reviewedAt?: string;
    reviewer?: string;
    reason?: string;
    documents: Array<{
      type: string;
      status: 'pending' | 'approved' | 'rejected';
      reason?: string;
    }>;
  }> {
    const response = await apiClient.get<any>(`${this.basePath}/${userId}/kyc/status`);
    return response.data;
  }

  async reviewKycVerification(
    userId: string,
    verificationId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<void> {
    await apiClient.put(`${this.basePath}/${userId}/kyc/${verificationId}/review`, {
      action,
      reason,
    });
  }

  // Export and reporting
  async exportUsers(query?: GetUsersQuery, format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Promise<Blob> {
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

  async exportMerchants(
    query?: {
      page?: number;
      limit?: number;
      status?: MerchantStatus;
      verified?: boolean;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    format: 'csv' | 'xlsx' | 'pdf' = 'csv'
  ): Promise<Blob> {
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
      `${this.basePath}/merchants/export?${params.toString()}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }
}

// Export singleton instance
export const usersService = new UsersService();
