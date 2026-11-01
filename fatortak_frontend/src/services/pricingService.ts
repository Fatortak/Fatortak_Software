import { apiClient } from "./api";
import {
  PagedResponseDto,
  PaginationDto,
  PriceListCreateDto,
  PriceListDto,
  PriceListFilterDto,
  PriceListUpdateDto,
  ResolvePriceDto,
} from "../types/api";

const buildParams = (
  pagination: PaginationDto,
  filters?: PriceListFilterDto
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
  return params;
};

export const pricingService = {
  getPriceLists: (pagination: PaginationDto, filters?: PriceListFilterDto) =>
    apiClient.get<PagedResponseDto<PriceListDto>>(
      "/api/pricelists",
      buildParams(pagination, filters)
    ),
  getPriceList: (id: string) =>
    apiClient.get<PriceListDto>(`/api/pricelists/${id}`),
  createPriceList: (data: PriceListCreateDto) =>
    apiClient.post<PriceListDto>("/api/pricelists", data),
  updatePriceList: (id: string, data: PriceListUpdateDto) =>
    apiClient.post<PriceListDto>(`/api/pricelists/update/${id}`, data),
  deletePriceList: (id: string) =>
    apiClient.post<boolean>(`/api/pricelists/delete/${id}`),
  assignCustomer: (id: string, customerId: string) =>
    apiClient.post<PriceListDto>(`/api/pricelists/${id}/customers`, {
      customerId,
    }),
  unassignCustomer: (id: string, customerId: string) =>
    apiClient.post<PriceListDto>(
      `/api/pricelists/${id}/customers/${customerId}/remove`
    ),
  resolve: (customerId: string, itemId: string, quantity = 1) =>
    apiClient.get<ResolvePriceDto>("/api/pricelists/resolve", {
      customerId,
      itemId,
      quantity,
    }),
};
