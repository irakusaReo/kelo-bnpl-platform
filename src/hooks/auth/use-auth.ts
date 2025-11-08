"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth as useAuthContext } from "@/contexts/auth-context";
import { authService } from "@/services/api/auth";
import { toast } from "sonner";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const { login: contextLogin } = useAuthContext();

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { user } = await authService.login(credentials);
      contextLogin(user);
      toast.success("Login successful!");
      return user;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
}

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const { register: contextRegister } = useAuthContext();

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role?: "customer" | "merchant";
  }) => {
    setLoading(true);
    try {
      const { user } = await authService.register(data);
      contextRegister(user);
      toast.success("Registration successful!");
      return user;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading };
}

export function useLogout() {
  const [loading, setLoading] = useState(false);
  const { logout: contextLogout } = useAuthContext();

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      contextLogout();
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading };
}

export function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user: contextUser } = useAuthContext();

  const fetchUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to fetch current user:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (contextUser) {
      setUser(contextUser);
      setLoading(false);
    } else {
      fetchUser();
    }
  }, [contextUser, fetchUser]);

  return { user, loading, refetch: fetchUser };
}
