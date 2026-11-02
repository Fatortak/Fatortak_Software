import { apiClient } from "./api";
import {
  ImportExecuteDto,
  ImportPreviewDto,
  ImportResultDto,
} from "../types/api";

export const importService = {
  preview: (file: File, entityType: string, isSupplier: boolean) => {
    const form = new FormData();
    form.append("file", file);
    form.append("entityType", entityType);
    form.append("isSupplier", String(isSupplier));
    return apiClient.post<ImportPreviewDto>("/api/import/preview", form);
  },
  execute: (data: ImportExecuteDto) =>
    apiClient.post<ImportResultDto>("/api/import/execute", data),
  importCustomers: (csv: string, isSupplier: boolean) =>
    apiClient.post<ImportResultDto>("/api/import/customers", {
      csv,
      isSupplier,
    }),
  importItems: (csv: string) =>
    apiClient.post<ImportResultDto>("/api/import/items", { csv }),
};
