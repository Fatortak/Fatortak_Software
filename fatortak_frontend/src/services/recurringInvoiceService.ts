import { apiClient } from "./api";
import {
  PagedResponseDto,
  PaginationDto,
  RecurringInvoiceCreateDto,
  RecurringInvoiceDto,
  RecurringInvoiceFilterDto,
  RecurringInvoiceUpdateDto,
} from "../types/api";

const buildParams = (
  pagination: PaginationDto,
  filters?: RecurringInvoiceFilterDto
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

export const recurringInvoiceService = {
  getSchedules: (
    pagination: PaginationDto,
    filters?: RecurringInvoiceFilterDto
  ) =>
    apiClient.get<PagedResponseDto<RecurringInvoiceDto>>(
      "/api/recurringinvoices",
      buildParams(pagination, filters)
    ),
  getSchedule: (id: string) =>
    apiClient.get<RecurringInvoiceDto>(`/api/recurringinvoices/${id}`),
  createSchedule: (data: RecurringInvoiceCreateDto) =>
    apiClient.post<RecurringInvoiceDto>("/api/recurringinvoices", data),
  updateSchedule: (id: string, data: RecurringInvoiceUpdateDto) =>
    apiClient.post<RecurringInvoiceDto>(
      `/api/recurringinvoices/update/${id}`,
      data
    ),
  deleteSchedule: (id: string) =>
    apiClient.post<boolean>(`/api/recurringinvoices/delete/${id}`),
  updateStatus: (id: string, status: string) =>
    apiClient.post<RecurringInvoiceDto>(
      `/api/recurringinvoices/${id}/status`,
      { status }
    ),
  runNow: (id: string) =>
    apiClient.post<RecurringInvoiceDto>(
      `/api/recurringinvoices/${id}/run-now`
    ),
};
