import { apiClient } from "./api";
import {
  PaginationDto,
  PagedResponseDto,
  PurchaseOrderCreateDto,
  PurchaseOrderDto,
  PurchaseOrderFilterDto,
  PurchaseOrderUpdateDto,
  SupplierBillCreateDto,
  SupplierBillDto,
  SupplierBillMatchingDto,
} from "../types/api";

const buildParams = (
  pagination: PaginationDto,
  filters?: PurchaseOrderFilterDto
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

export const purchaseOrderService = {
  getPurchaseOrders: (
    pagination: PaginationDto,
    filters?: PurchaseOrderFilterDto
  ) =>
    apiClient.get<PagedResponseDto<PurchaseOrderDto>>(
      "/api/purchaseorders",
      buildParams(pagination, filters)
    ),
  getPurchaseOrder: (id: string) =>
    apiClient.get<PurchaseOrderDto>(`/api/purchaseorders/${id}`),
  createPurchaseOrder: (data: PurchaseOrderCreateDto) =>
    apiClient.post<PurchaseOrderDto>("/api/purchaseorders", data),
  updatePurchaseOrder: (id: string, data: PurchaseOrderUpdateDto) =>
    apiClient.post<PurchaseOrderDto>(
      `/api/purchaseorders/update/${id}`,
      data
    ),
  deletePurchaseOrder: (id: string) =>
    apiClient.post<boolean>(`/api/purchaseorders/delete/${id}`),
  updateStatus: (id: string, status: string) =>
    apiClient.post<PurchaseOrderDto>(`/api/purchaseorders/${id}/status`, {
      status,
    }),
  getSupplierBills: (id: string) =>
    apiClient.get<SupplierBillMatchingDto>(
      `/api/purchaseorders/${id}/supplier-bills`
    ),
  createSupplierBill: (id: string, data: SupplierBillCreateDto) =>
    apiClient.post<SupplierBillDto>(
      `/api/purchaseorders/${id}/supplier-bills`,
      data
    ),
};
