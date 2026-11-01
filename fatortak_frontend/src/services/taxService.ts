import { apiClient } from "./api";
import { EInvoiceExportDto, VatReturnDto } from "../types/api";

export const taxService = {
  getVatReturn: (fromDate: string, toDate: string) =>
    apiClient.get<VatReturnDto>("/api/tax/vat-return", {
      fromDate,
      toDate,
    }),
  getEInvoices: (fromDate: string, toDate: string) =>
    apiClient.get<EInvoiceExportDto>("/api/tax/e-invoices", {
      fromDate,
      toDate,
    }),
};
