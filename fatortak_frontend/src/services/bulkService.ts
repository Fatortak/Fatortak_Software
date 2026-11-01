import { apiClient } from "./api";
import { BulkActionResultDto } from "../types/api";

export const bulkService = {
  deleteCustomers: (ids: string[]) =>
    apiClient.post<BulkActionResultDto>("/api/bulk/customers/delete", { ids }),
  activateCustomers: (ids: string[], isActive: boolean) =>
    apiClient.post<BulkActionResultDto>("/api/bulk/customers/activate", {
      ids,
      isActive,
    }),
  deleteItems: (ids: string[]) =>
    apiClient.post<BulkActionResultDto>("/api/bulk/items/delete", { ids }),
  activateItems: (ids: string[], isActive: boolean) =>
    apiClient.post<BulkActionResultDto>("/api/bulk/items/activate", {
      ids,
      isActive,
    }),
};
