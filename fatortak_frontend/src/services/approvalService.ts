import { apiClient } from "./api";
import {
  ApprovalCandidateDto,
  ApprovalDecisionDto,
  ApprovalPolicyDto,
  ApprovalRequestCreateDto,
  ApprovalRequestDto,
  ApprovalRequestFilterDto,
  PagedResponseDto,
  PaginationDto,
} from "../types/api";

const buildParams = (
  pagination: PaginationDto,
  filters?: ApprovalRequestFilterDto
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

export const approvalService = {
  getRequests: (
    pagination: PaginationDto,
    filters?: ApprovalRequestFilterDto
  ) =>
    apiClient.get<PagedResponseDto<ApprovalRequestDto>>(
      "/api/approvals",
      buildParams(pagination, filters)
    ),
  getRequest: (id: string) =>
    apiClient.get<ApprovalRequestDto>(`/api/approvals/${id}`),
  getCandidates: (documentType: string) =>
    apiClient.get<ApprovalCandidateDto[]>("/api/approvals/candidates", {
      documentType,
    }),
  createRequest: (data: ApprovalRequestCreateDto) =>
    apiClient.post<ApprovalRequestDto>("/api/approvals", data),
  approve: (id: string, data: ApprovalDecisionDto) =>
    apiClient.post<ApprovalRequestDto>(`/api/approvals/${id}/approve`, data),
  reject: (id: string, data: ApprovalDecisionDto) =>
    apiClient.post<ApprovalRequestDto>(`/api/approvals/${id}/reject`, data),
  cancel: (id: string) =>
    apiClient.post<ApprovalRequestDto>(`/api/approvals/${id}/cancel`),
  getPolicies: () =>
    apiClient.get<ApprovalPolicyDto[]>("/api/approvals/policies"),
  savePolicy: (data: ApprovalPolicyDto) =>
    apiClient.post<ApprovalPolicyDto>("/api/approvals/policies", data),
};
