import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoiceNoteService } from "../services/invoiceNoteService";
import { unwrapServiceResult } from "../services/api";
import {
  InvoiceNoteCreateDto,
  InvoiceNoteFilterDto,
  InvoiceNoteUpdateDto,
  PaginationDto,
} from "../types/api";

export const useInvoiceNotes = (
  pagination: PaginationDto,
  filters?: InvoiceNoteFilterDto
) =>
  useQuery({
    queryKey: ["invoice-notes", pagination, filters],
    queryFn: () => invoiceNoteService.getNotes(pagination, filters),
  });

export const useInvoiceNote = (id?: string) =>
  useQuery({
    queryKey: ["invoice-note", id],
    queryFn: () => invoiceNoteService.getNote(id!),
    enabled: !!id,
  });

const invalidate = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: ["invoice-notes"] });
  client.invalidateQueries({ queryKey: ["invoice-note"] });
  client.invalidateQueries({ queryKey: ["invoices"] });
  client.invalidateQueries({ queryKey: ["invoice"] });
};

export const useCreateInvoiceNote = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: InvoiceNoteCreateDto) =>
      unwrapServiceResult(invoiceNoteService.createNote(data)),
    onSuccess: () => invalidate(client),
  });
};

export const useUpdateInvoiceNote = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvoiceNoteUpdateDto }) =>
      unwrapServiceResult(invoiceNoteService.updateNote(id, data)),
    onSuccess: () => invalidate(client),
  });
};

export const useDeleteInvoiceNote = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(invoiceNoteService.deleteNote(id)),
    onSuccess: () => invalidate(client),
  });
};

export const usePostInvoiceNote = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(invoiceNoteService.postNote(id)),
    onSuccess: () => invalidate(client),
  });
};

export const useCancelInvoiceNote = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(invoiceNoteService.cancelNote(id)),
    onSuccess: () => invalidate(client),
  });
};
