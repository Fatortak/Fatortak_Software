import { apiClient } from "./api";
import type {
  PagedResponseDto,
  PlatformOverviewDto,
  PlatformTenantDto,
  PlatformUserDto,
} from "../types/api";

export interface PlatformTenantFilters {
  search?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PlatformUserFilters {
  search?: string;
  tenantId?: string;
  role?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export const platformService = {
  getOverview: () =>
    apiClient.get<PlatformOverviewDto>("/api/platform/overview"),

  getTenants: (filters: PlatformTenantFilters = {}) =>
    apiClient.get<PagedResponseDto<PlatformTenantDto>>(
      "/api/platform/tenants",
      {
        pageNumber: filters.pageNumber ?? 1,
        pageSize: filters.pageSize ?? 20,
        search: filters.search,
        status: filters.status,
      }
    ),

  getUsers: (filters: PlatformUserFilters = {}) =>
    apiClient.get<PagedResponseDto<PlatformUserDto>>("/api/platform/users", {
      pageNumber: filters.pageNumber ?? 1,
      pageSize: filters.pageSize ?? 20,
      search: filters.search,
      tenantId: filters.tenantId,
      role: filters.role,
      isActive: filters.isActive,
    }),

  setTenantStatus: (tenantId: string, isActive: boolean) =>
    apiClient.post<boolean>(`/api/platform/tenants/${tenantId}/status`, {
      isActive,
    }),

  setUserStatus: (userId: string, isActive: boolean) =>
    apiClient.post<boolean>(`/api/platform/users/${userId}/status`, {
      isActive,
    }),

  setUserRole: (userId: string, role: string) =>
    apiClient.post<boolean>(`/api/platform/users/${userId}/role`, { role }),
};
