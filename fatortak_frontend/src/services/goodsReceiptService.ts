import { apiClient } from "./api";
import {
  GoodsReceiptCreateDto,
  GoodsReceiptDto,
  GoodsReceiptFilterDto,
  GoodsReceiptUpdateDto,
  PagedResponseDto,
  PaginationDto,
} from "../types/api";

const buildParams = (
  pagination: PaginationDto,
  filters?: GoodsReceiptFilterDto
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

export const goodsReceiptService = {
  getGoodsReceipts: (
    pagination: PaginationDto,
    filters?: GoodsReceiptFilterDto
  ) =>
    apiClient.get<PagedResponseDto<GoodsReceiptDto>>(
      "/api/goodsreceipts",
      buildParams(pagination, filters)
    ),
  getGoodsReceipt: (id: string) =>
    apiClient.get<GoodsReceiptDto>(`/api/goodsreceipts/${id}`),
  createGoodsReceipt: (data: GoodsReceiptCreateDto) =>
    apiClient.post<GoodsReceiptDto>("/api/goodsreceipts", data),
  updateGoodsReceipt: (id: string, data: GoodsReceiptUpdateDto) =>
    apiClient.post<GoodsReceiptDto>(`/api/goodsreceipts/update/${id}`, data),
  postGoodsReceipt: (id: string) =>
    apiClient.post<GoodsReceiptDto>(`/api/goodsreceipts/${id}/post`),
  updateStatus: (id: string, status: string) =>
    apiClient.post<GoodsReceiptDto>(`/api/goodsreceipts/${id}/status`, {
      status,
    }),
  deleteGoodsReceipt: (id: string) =>
    apiClient.post<boolean>(`/api/goodsreceipts/delete/${id}`),
};
