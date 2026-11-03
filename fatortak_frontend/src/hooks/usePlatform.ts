import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformService } from "../services/platformService";
import { unwrapServiceResult } from "../services/api";
import type {
  PlatformTenantFilters,
  PlatformUserFilters,
} from "../services/platformService";

export const platformKeys = {
  all: ["platform"] as const,
  overview: () => [...platformKeys.all, "overview"] as const,
  tenants: (filters: PlatformTenantFilters) =>
    [...platformKeys.all, "tenants", filters] as const,
  users: (filters: PlatformUserFilters) =>
    [...platformKeys.all, "users", filters] as const,
};

export const usePlatformOverview = (enabled = true) =>
  useQuery({
    queryKey: platformKeys.overview(),
    queryFn: () => unwrapServiceResult(platformService.getOverview()),
    enabled,
  });

export const usePlatformTenants = (
  filters: PlatformTenantFilters,
  enabled = true
) =>
  useQuery({
    queryKey: platformKeys.tenants(filters),
    queryFn: () => unwrapServiceResult(platformService.getTenants(filters)),
    enabled,
  });

export const usePlatformUsers = (
  filters: PlatformUserFilters,
  enabled = true
) =>
  useQuery({
    queryKey: platformKeys.users(filters),
    queryFn: () => unwrapServiceResult(platformService.getUsers(filters)),
    enabled,
  });

const usePlatformMutation = <TVariables,>(
  mutationFn: (variables: TVariables) => Promise<unknown>
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformKeys.all }),
  });
};

export const useSetTenantStatus = () =>
  usePlatformMutation(
    ({ tenantId, isActive }: { tenantId: string; isActive: boolean }) =>
      unwrapServiceResult(platformService.setTenantStatus(tenantId, isActive))
  );

export const useSetUserStatus = () =>
  usePlatformMutation(
    ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      unwrapServiceResult(platformService.setUserStatus(userId, isActive))
  );

export const useSetUserRole = () =>
  usePlatformMutation(
    ({ userId, role }: { userId: string; role: string }) =>
      unwrapServiceResult(platformService.setUserRole(userId, role))
  );
