import { apiClient } from "./api";
import {
  InventoryValuationSummaryDto,
  PagedResponseDto,
  PaginationDto,
  StockAdjustmentCreateDto,
  StockAdjustmentDto,
  StockAdjustmentFilterDto,
} from "../types/api";

const buildParams = (
  pagination: PaginationDto,
  filters?: StockAdjustmentFilterDto
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

export const inventoryService = {
  getValuation: () =>
    apiClient.get<InventoryValuationSummaryDto>("/api/inventory/valuations"),
  getAdjustments: (
    pagination: PaginationDto,
    filters?: StockAdjustmentFilterDto
  ) =>
    apiClient.get<PagedResponseDto<StockAdjustmentDto>>(
      "/api/inventory/adjustments",
      buildParams(pagination, filters)
    ),
  createAdjustment: (data: StockAdjustmentCreateDto) =>
    apiClient.post<StockAdjustmentDto>("/api/inventory/adjustments", data),
};
