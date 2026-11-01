import { apiClient } from "./api";
import {
  AuditLogDto,
  AuditLogFilterDto,
  PagedResponseDto,
  PaginationDto,
} from "../types/api";

const buildParams = (
  pagination: PaginationDto,
  filters?: AuditLogFilterDto
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

export const auditService = {
  getLogs: (pagination: PaginationDto, filters?: AuditLogFilterDto) =>
    apiClient.get<PagedResponseDto<AuditLogDto>>(
      "/api/audit",
      buildParams(pagination, filters)
    ),
};
