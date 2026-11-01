import { apiClient } from "./api";
import {
  CommissionFilterDto,
  CommissionRuleCreateDto,
  CommissionRuleDto,
  CommissionRuleUpdateDto,
  GenerateCommissionDto,
  PagedResponseDto,
  PaginationDto,
  SalesCommissionDto,
} from "../types/api";

const buildParams = (
  pagination: PaginationDto,
  filters?: CommissionFilterDto
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

export const commissionService = {
  getRules: () => apiClient.get<CommissionRuleDto[]>("/api/commissions/rules"),
  createRule: (data: CommissionRuleCreateDto) =>
    apiClient.post<CommissionRuleDto>("/api/commissions/rules", data),
  updateRule: (id: string, data: CommissionRuleUpdateDto) =>
    apiClient.post<CommissionRuleDto>(`/api/commissions/rules/update/${id}`, data),
  deleteRule: (id: string) =>
    apiClient.post<boolean>(`/api/commissions/rules/delete/${id}`),
  getCommissions: (
    pagination: PaginationDto,
    filters?: CommissionFilterDto
  ) =>
    apiClient.get<PagedResponseDto<SalesCommissionDto>>(
      "/api/commissions",
      buildParams(pagination, filters)
    ),
  generate: (data: GenerateCommissionDto) =>
    apiClient.post<SalesCommissionDto>("/api/commissions/generate", data),
  approve: (id: string) =>
    apiClient.post<SalesCommissionDto>(`/api/commissions/${id}/approve`),
  pay: (id: string) =>
    apiClient.post<SalesCommissionDto>(`/api/commissions/${id}/pay`),
  cancel: (id: string) =>
    apiClient.post<SalesCommissionDto>(`/api/commissions/${id}/cancel`),
};
