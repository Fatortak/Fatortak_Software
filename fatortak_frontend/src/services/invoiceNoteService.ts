import { apiClient } from "./api";
import {
  InvoiceNoteCreateDto,
  InvoiceNoteDto,
  InvoiceNoteFilterDto,
  InvoiceNoteUpdateDto,
  PagedResponseDto,
  PaginationDto,
} from "../types/api";

const buildParams = (
  pagination: PaginationDto,
  filters?: InvoiceNoteFilterDto
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

export const invoiceNoteService = {
  getNotes: (pagination: PaginationDto, filters?: InvoiceNoteFilterDto) =>
    apiClient.get<PagedResponseDto<InvoiceNoteDto>>(
      "/api/invoicenotes",
      buildParams(pagination, filters)
    ),
  getNote: (id: string) => apiClient.get<InvoiceNoteDto>(`/api/invoicenotes/${id}`),
  createNote: (data: InvoiceNoteCreateDto) =>
    apiClient.post<InvoiceNoteDto>("/api/invoicenotes", data),
  updateNote: (id: string, data: InvoiceNoteUpdateDto) =>
    apiClient.post<InvoiceNoteDto>(`/api/invoicenotes/update/${id}`, data),
  deleteNote: (id: string) =>
    apiClient.post<boolean>(`/api/invoicenotes/delete/${id}`),
  postNote: (id: string) =>
    apiClient.post<InvoiceNoteDto>(`/api/invoicenotes/${id}/post`),
  cancelNote: (id: string) =>
    apiClient.post<InvoiceNoteDto>(`/api/invoicenotes/${id}/cancel`),
};
