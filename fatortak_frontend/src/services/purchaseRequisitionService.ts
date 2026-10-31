import { apiClient } from "./api";
import {
  PaginationDto,
  PagedResponseDto,
  PurchaseRequisitionCreateDto,
  PurchaseRequisitionDto,
  PurchaseRequisitionFilterDto,
  PurchaseRequisitionUpdateDto,
} from "../types/api";

export const purchaseRequisitionService = {
  getRequisitions: async (
    pagination: PaginationDto,
    filters?: PurchaseRequisitionFilterDto
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
    return apiClient.get<PagedResponseDto<PurchaseRequisitionDto>>(
      "/api/purchaserequisitions",
      params
    );
  },
  getRequisition: (id: string) =>
    apiClient.get<PurchaseRequisitionDto>(`/api/purchaserequisitions/${id}`),
  createRequisition: (data: PurchaseRequisitionCreateDto) =>
    apiClient.post<PurchaseRequisitionDto>("/api/purchaserequisitions", data),
  updateRequisition: (id: string, data: PurchaseRequisitionUpdateDto) =>
    apiClient.post<PurchaseRequisitionDto>(
      `/api/purchaserequisitions/update/${id}`,
      data
    ),
  deleteRequisition: (id: string) =>
    apiClient.post<boolean>(`/api/purchaserequisitions/delete/${id}`),
  updateStatus: (id: string, status: string) =>
    apiClient.post<PurchaseRequisitionDto>(
      `/api/purchaserequisitions/${id}/status`,
      { status }
    ),
};
