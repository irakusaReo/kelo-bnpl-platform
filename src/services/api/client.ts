import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || "An error occurred";
    
    // Show toast notification for errors
    if (error.response?.status >= 400) {
      toast.error(message);
    }
    
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/auth/login";
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;