import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recurringInvoiceService } from "../services/recurringInvoiceService";
import { unwrapServiceResult } from "../services/api";
import {
  PaginationDto,
  RecurringInvoiceCreateDto,
  RecurringInvoiceFilterDto,
  RecurringInvoiceUpdateDto,
} from "../types/api";

export const useRecurringInvoices = (
  pagination: PaginationDto,
  filters?: RecurringInvoiceFilterDto
) =>
  useQuery({
    queryKey: ["recurring-invoices", pagination, filters],
    queryFn: () => recurringInvoiceService.getSchedules(pagination, filters),
  });

const invalidate = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: ["recurring-invoices"] });
  client.invalidateQueries({ queryKey: ["invoices"] });
};

export const useCreateRecurringInvoice = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: RecurringInvoiceCreateDto) =>
      unwrapServiceResult(recurringInvoiceService.createSchedule(data)),
    onSuccess: () => invalidate(client),
  });
};

export const useUpdateRecurringInvoice = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: RecurringInvoiceUpdateDto;
    }) => unwrapServiceResult(recurringInvoiceService.updateSchedule(id, data)),
    onSuccess: () => invalidate(client),
  });
};

export const useDeleteRecurringInvoice = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(recurringInvoiceService.deleteSchedule(id)),
    onSuccess: () => invalidate(client),
  });
};

export const useUpdateRecurringInvoiceStatus = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      unwrapServiceResult(recurringInvoiceService.updateStatus(id, status)),
    onSuccess: () => invalidate(client),
  });
};

export const useRunRecurringInvoiceNow = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(recurringInvoiceService.runNow(id)),
    onSuccess: () => invalidate(client),
  });
};
