import { apiClient } from "./api";
import {
  AwardRfqDto,
  PaginationDto,
  PagedResponseDto,
  RfqCreateDto,
  RfqDto,
  RfqFilterDto,
  RfqSupplierQuoteDto,
  RfqUpdateDto,
} from "../types/api";

const buildParams = (pagination: PaginationDto, filters?: RfqFilterDto) => {
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
  return params;
};

export const rfqService = {
  getRfqs: (pagination: PaginationDto, filters?: RfqFilterDto) =>
    apiClient.get<PagedResponseDto<RfqDto>>(
      "/api/rfqs",
      buildParams(pagination, filters)
    ),
  getRfq: (id: string) => apiClient.get<RfqDto>(`/api/rfqs/${id}`),
  createRfq: (data: RfqCreateDto) =>
    apiClient.post<RfqDto>("/api/rfqs", data),
  updateRfq: (id: string, data: RfqUpdateDto) =>
    apiClient.post<RfqDto>(`/api/rfqs/update/${id}`, data),
  deleteRfq: (id: string) =>
    apiClient.post<boolean>(`/api/rfqs/delete/${id}`),
  updateStatus: (id: string, status: string) =>
    apiClient.post<RfqDto>(`/api/rfqs/${id}/status`, { status }),
  recordQuote: (id: string, supplierId: string, data: RfqSupplierQuoteDto) =>
    apiClient.post<RfqDto>(
      `/api/rfqs/${id}/suppliers/${supplierId}/quote`,
      data
    ),
  awardRfq: (id: string, supplierId: string, data: AwardRfqDto) =>
    apiClient.post<RfqDto>(
      `/api/rfqs/${id}/award/${supplierId}`,
      data
    ),
};
