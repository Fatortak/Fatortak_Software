import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthResponseDto, UserDto, TenantDto } from "../types/api";
import { apiClient, API_BASE_URL, ServiceResult } from "../services/api";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: UserDto | null;
  tenant: TenantDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<ServiceResult<any>>;
  logout: () => void;
  switchTenant: (tenantId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [tenant, setTenant] = useState<TenantDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const isAuthenticated = !!user;

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const result = await apiClient.get<any>("/api/auth/me", undefined, {
          skipAuthRedirect: true,
        });
        if (result.success && result.data) {
          setUser(result.data.user);
          setTenant(result.data.tenant ?? null);
          localStorage.setItem("user_data", JSON.stringify(result.data.user));
          if (result.data.tenant) {
            localStorage.setItem("tenant_data", JSON.stringify(result.data.tenant));
          }
        } else {
          localStorage.removeItem("user_data");
          localStorage.removeItem("tenant_data");
        }
      } catch {
        localStorage.removeItem("user_data");
        localStorage.removeItem("tenant_data");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await apiClient.post<any>("/api/auth/login", {
        email,
        password,
      });

      if (result.success && result.data) {
        queryClient.clear();

        const { user: userData, tenant: tenantData } = result.data;

        localStorage.setItem("user_data", JSON.stringify(userData));
        if (tenantData) {
          localStorage.setItem("tenant_data", JSON.stringify(tenantData));
        }

        setUser(userData);
        setTenant(tenantData);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const register = async (data: any): Promise<ServiceResult<any>> => {
    try {
      const result = await apiClient.post<any>("/api/auth/register", data);

      // Check if the request was successful
      if (result.success && result.data) {
        queryClient.clear();
        const { user: userData, tenant: tenantData } = result.data;

        localStorage.setItem("user_data", JSON.stringify(userData));
        if (tenantData) {
          localStorage.setItem("tenant_data", JSON.stringify(tenantData));
        }

        setUser(userData);
        setTenant(tenantData);
        return result;
      } else {
        // Return the error response from the server
        return result;
      }
    } catch (error: any) {
      // Handle network errors or other exceptions
      return {
        success: false,
        data: null,
        errorMessage: error.message || "Registration failed",
        errors: null,
      };
    }
  };

  const logout = () => {
    void fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
    localStorage.removeItem("user_data");
    localStorage.removeItem("tenant_data");
    apiClient.clearToken();
    queryClient.clear();
    setUser(null);
    setTenant(null);
  };

  const switchTenant = async (tenantId: string): Promise<boolean> => {
    try {
      const result = await apiClient.post<any>("/api/auth/switch-tenant", {
        tenantId,
      });

      if (result.success && result.data) {
        const { user: userData, tenant: tenantData } = result.data;

        localStorage.setItem("user_data", JSON.stringify(userData));
        localStorage.setItem("tenant_data", JSON.stringify(tenantData));

        setUser(userData);
        setTenant(tenantData);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
