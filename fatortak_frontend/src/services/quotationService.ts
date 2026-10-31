import { apiClient } from "./api";
import {
  ConvertQuotationDto,
  ConvertQuotationResultDto,
  PaginationDto,
  PagedResponseDto,
  QuotationCreateDto,
  QuotationDto,
  QuotationFilterDto,
  QuotationUpdateDto,
} from "../types/api";

export const quotationService = {
  getQuotations: async (
    pagination: PaginationDto,
    filters?: QuotationFilterDto
  ) => {
    const params: Record<string, any> = {
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
    };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value;
        }
      });
    }
    return apiClient.get<PagedResponseDto<QuotationDto>>(
      "/api/quotations",
      params
    );
  },

  getQuotation: async (id: string) =>
    apiClient.get<QuotationDto>(`/api/quotations/${id}`),

  createQuotation: async (data: QuotationCreateDto) =>
    apiClient.post<QuotationDto>("/api/quotations", data),

  updateQuotation: async (id: string, data: QuotationUpdateDto) =>
    apiClient.post<QuotationDto>(`/api/quotations/update/${id}`, data),

  deleteQuotation: async (id: string) =>
    apiClient.post<boolean>(`/api/quotations/delete/${id}`),

  updateStatus: async (id: string, status: string) =>
    apiClient.post<QuotationDto>(`/api/quotations/${id}/status`, { status }),

  sendQuotation: async (id: string) =>
    apiClient.post<boolean>(`/api/quotations/${id}/send`),

  duplicateQuotation: async (id: string) =>
    apiClient.post<QuotationDto>(`/api/quotations/${id}/duplicate`),

  convertToSalesOrder: async (id: string) =>
    apiClient.post<QuotationDto>(`/api/quotations/${id}/convert-to-sales-order`),

  convertToDeliveryNote: async (id: string) =>
    apiClient.post<QuotationDto>(`/api/quotations/${id}/convert-to-delivery-note`),

  convertToInvoice: async (id: string, data: ConvertQuotationDto = {}) =>
    apiClient.post<ConvertQuotationResultDto>(
      `/api/quotations/${id}/convert-to-invoice`,
      data
    ),
};
