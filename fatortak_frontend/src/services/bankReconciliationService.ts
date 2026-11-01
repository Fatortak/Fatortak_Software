import { apiClient } from "./api";
import {
  BankStatementDto,
  BankStatementFilterDto,
  BankStatementImportDto,
  BankTransactionCandidateDto,
  PagedResponseDto,
  PaginationDto,
} from "../types/api";

const buildParams = (
  pagination: PaginationDto,
  filters?: BankStatementFilterDto
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

export const bankReconciliationService = {
  getStatements: (
    pagination: PaginationDto,
    filters?: BankStatementFilterDto
  ) =>
    apiClient.get<PagedResponseDto<BankStatementDto>>(
      "/api/bankstatements",
      buildParams(pagination, filters)
    ),
  getStatement: (id: string) =>
    apiClient.get<BankStatementDto>(`/api/bankstatements/${id}`),
  importStatement: (data: BankStatementImportDto) =>
    apiClient.post<BankStatementDto>("/api/bankstatements/import", data),
  match: (statementId: string, lineId: string, transactionId: string) =>
    apiClient.post<BankStatementDto>(
      `/api/bankstatements/${statementId}/lines/${lineId}/match`,
      { transactionId }
    ),
  unmatch: (statementId: string, lineId: string) =>
    apiClient.post<BankStatementDto>(
      `/api/bankstatements/${statementId}/lines/${lineId}/unmatch`
    ),
  ignore: (statementId: string, lineId: string) =>
    apiClient.post<BankStatementDto>(
      `/api/bankstatements/${statementId}/lines/${lineId}/ignore`
    ),
  adjustment: (statementId: string, lineId: string) =>
    apiClient.post<BankStatementDto>(
      `/api/bankstatements/${statementId}/lines/${lineId}/adjustment`
    ),
  reconcile: (statementId: string) =>
    apiClient.post<BankStatementDto>(
      `/api/bankstatements/${statementId}/reconcile`
    ),
  delete: (statementId: string) =>
    apiClient.post<boolean>(`/api/bankstatements/delete/${statementId}`),
  candidates: (statementId: string, lineId: string) =>
    apiClient.get<BankTransactionCandidateDto[]>(
      `/api/bankstatements/${statementId}/lines/${lineId}/candidates`
    ),
};
