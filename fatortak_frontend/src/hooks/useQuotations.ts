import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotationService } from "../services/quotationService";
import { unwrapServiceResult } from "../services/api";
import {
  ConvertQuotationDto,
  PaginationDto,
  QuotationCreateDto,
  QuotationFilterDto,
  QuotationUpdateDto,
} from "../types/api";

export const useQuotations = (
  pagination: PaginationDto,
  filters?: QuotationFilterDto
) =>
  useQuery({
    queryKey: ["quotations", pagination, filters],
    queryFn: () => quotationService.getQuotations(pagination, filters),
  });

export const useQuotation = (id: string) =>
  useQuery({
    queryKey: ["quotation", id],
    queryFn: () => quotationService.getQuotation(id),
    enabled: !!id,
  });

const invalidate = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ["quotations"] });
};

export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: QuotationCreateDto) =>
      unwrapServiceResult(quotationService.createQuotation(data)),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: QuotationUpdateDto }) =>
      unwrapServiceResult(quotationService.updateQuotation(id, data)),
    onSuccess: (_, { id }) => {
      invalidate(queryClient);
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
    },
  });
};

export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(quotationService.deleteQuotation(id)),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateQuotationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      unwrapServiceResult(quotationService.updateStatus(id, status)),
    onSuccess: (_, { id }) => {
      invalidate(queryClient);
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
    },
  });
};

export const useSendQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(quotationService.sendQuotation(id)),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDuplicateQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(quotationService.duplicateQuotation(id)),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useConvertQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ConvertQuotationDto }) =>
      unwrapServiceResult(quotationService.convertToInvoice(id, data ?? {})),
    onSuccess: () => {
      invalidate(queryClient);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};

export const useConvertToSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(quotationService.convertToSalesOrder(id)),
    onSuccess: () => {
      invalidate(queryClient);
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    },
  });
};
