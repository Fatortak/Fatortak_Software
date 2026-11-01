import { apiClient } from "./api";
import { ImportResultDto } from "../types/api";

export const importService = {
  importCustomers: (csv: string, isSupplier: boolean) =>
    apiClient.post<ImportResultDto>("/api/import/customers", {
      csv,
      isSupplier,
    }),
  importItems: (csv: string) =>
    apiClient.post<ImportResultDto>("/api/import/items", { csv }),
};
