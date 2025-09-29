import apiClient from "./client";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "customer" | "merchant" | "admin";
  creditScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: "customer" | "merchant";
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/login", credentials);
    const { user, token } = response.data;
    
    // Store token
    localStorage.setItem("auth_token", token);
    
    return { user, token };
  },

  // Register user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/register", data);
    const { user, token } = response.data;
    
    // Store token
    localStorage.setItem("auth_token", token);
    
    return { user, token };
  },

  // Logout user
  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
    localStorage.removeItem("auth_token");
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put("/auth/profile", data);
    return response.data;
  },

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await apiClient.post("/auth/change-password", data);
  },

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post("/auth/forgot-password", { email });
  },

  // Reset password
  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<void> {
    await apiClient.post("/auth/reset-password", data);
  },
};