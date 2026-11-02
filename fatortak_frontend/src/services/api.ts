// Enhanced API client without Supabase dependencies
const configuredApiUrl =
  import.meta.env.VITE_API_URL || "https://localhost:44338";

const alignLocalApiHost = (value: string) => {
  if (typeof window === "undefined") return value;
  try {
    const url = new URL(value);
    const localHosts = ["localhost", "127.0.0.1"];
    if (
      localHosts.includes(url.hostname) &&
      localHosts.includes(window.location.hostname) &&
      url.hostname !== window.location.hostname
    ) {
      url.hostname = window.location.hostname;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return value;
  }
};

export const API_BASE_URL = alignLocalApiHost(configuredApiUrl);

export interface ServiceResult<T> {
  success: boolean;
  data: T | null;
  errorMessage?: string;
  errors?: string[];
}

/**
 * Turn a failed ServiceResult into a rejected promise so React Query
 * mutations do not run onSuccess for an API failure.
 */
export const unwrapServiceResult = async <T>(
  promise: Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> => {
  const result = await promise;
  if (!result.success) {
    throw new Error(result.errorMessage || "The request failed.");
  }
  return result;
};

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private subscriptionRequiredHandler: (() => void) | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // The browser session is carried by the HttpOnly cookie.
    // The in-memory token is only for non-browser/API compatibility.
    this.token = null;
  }

  setSubscriptionRequiredHandler(handler: () => void) {
    this.subscriptionRequiredHandler = handler;
  }

  setToken(token: string) {
    // Keep the token in memory only; never persist JWTs in localStorage.
    this.token = token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("tenant_data");
    localStorage.removeItem("subscription_required");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    additionalHeaders: Record<string, string> = {},
    config?: { responseType?: "json" | "blob"; skipAuthRedirect?: boolean }
  ): Promise<ServiceResult<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const responseType = config?.responseType || "json";

    const requestConfig: RequestInit = {
      ...options,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...additionalHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, requestConfig);

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          // Only redirect if we're not already on the login page and the
          // caller did not explicitly opt out (e.g. session bootstrap).
          if (
            !config?.skipAuthRedirect &&
            !window.location.pathname.includes("/login")
          ) {
            window.location.href = "/login";
          }
          throw new Error("Unauthorized");
        }

        // Handle 430 status code (subscription required)
        if (response.status === 430) {
          // Set flag to restrict access to only subscription pages
          localStorage.setItem("subscription_required", "true");

          if (this.subscriptionRequiredHandler) {
            this.subscriptionRequiredHandler();
          }

          // Redirect to subscription plans if not already there
          const currentPath = window.location.pathname;
          const allowedPaths = ["/subscription-plans", "/payment"];
          if (!allowedPaths.includes(currentPath)) {
            window.location.href = "/subscription-plans";
          }

          throw new Error("Subscription required");
        }

        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.errorMessage || `HTTP error! status: ${response.status}`
        );
      }

      // Clear subscription restriction flag on successful requests
      localStorage.removeItem("subscription_required");
      if (responseType === "blob") {
        const blob = await response.blob();
        return {
          success: true,
          data: blob as T,
          errorMessage: undefined,
          errors: undefined,
        };
      }
      // Handle 204 No Content responses
      if (response.status === 204) {
        return {
          success: true,
          data: null as T,
          errorMessage: undefined,
          errors: undefined,
        };
      }

      const data = await response.json();

      // Check if response has the ServiceResult format
      if (Object.prototype.hasOwnProperty.call(data, "success")) {
        return data;
      }

      // If not ServiceResult format, wrap it
      return {
        success: true,
        data,
        errorMessage: undefined,
        errors: undefined,
      };
    } catch (error) {
      return {
        success: false,
        data: null as T,
        errorMessage:
          error instanceof Error ? error.message : "Unknown error occurred",
        errors: undefined,
      };
    }
  }

  // GET request with query parameters
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    config?: { responseType?: "json" | "blob"; skipAuthRedirect?: boolean }
  ): Promise<ServiceResult<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value.toString());
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.request<T>(url, {}, {}, config);
  }

  // GET request returning a Blob
  async getBlob(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<Blob> {
    const result = await this.get<Blob>(endpoint, params, { responseType: "blob" });
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.errorMessage || "Failed to download file");
  }

  // POST request
  async post<T>(
    endpoint: string,
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<ServiceResult<T>> {
    const isFormData = data instanceof FormData;

    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      },
      headers
    );
  }

  // PUT request
  async put<T>(
    endpoint: string,
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<ServiceResult<T>> {
    const isFormData = data instanceof FormData;

    return this.request<T>(
      endpoint,
      {
        method: "PUT",
        body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      },
      headers
    );
  }

  // PATCH request
  async patch<T>(
    endpoint: string,
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<ServiceResult<T>> {
    return this.request<T>(
      endpoint,
      {
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
      },
      headers
    );
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ServiceResult<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }

  // File upload
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ServiceResult<T>> {
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      // Don't set Content-Type for FormData, browser will set it with boundary
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Mock data for development fallback
export const mockData = {
  user: {
    id: "1",
    name: "Ahmed Mohamed",
    email: "ahmed@example.com",
    avatar: null,
    role: "admin",
  },
  notifications: [
    {
      id: 1,
      title: "Welcome to the System",
      message: "Dashboard updated successfully",
      time: "5m ago",
      unread: true,
      type: "success",
    },
  ],
};
