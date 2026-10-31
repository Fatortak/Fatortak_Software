import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rfqService } from "../services/rfqService";
import { unwrapServiceResult } from "../services/api";
import {
  AwardRfqDto,
  PaginationDto,
  RfqCreateDto,
  RfqFilterDto,
  RfqSupplierQuoteDto,
  RfqUpdateDto,
} from "../types/api";

export const useRfqs = (pagination: PaginationDto, filters?: RfqFilterDto) =>
  useQuery({
    queryKey: ["rfqs", pagination, filters],
    queryFn: () => rfqService.getRfqs(pagination, filters),
  });

export const useRfq = (id?: string) =>
  useQuery({
    queryKey: ["rfq", id],
    queryFn: () => rfqService.getRfq(id!),
    enabled: !!id,
  });

const invalidate = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: ["rfqs"] });
  client.invalidateQueries({ queryKey: ["rfq"] });
};

export const useCreateRfq = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: RfqCreateDto) =>
      unwrapServiceResult(rfqService.createRfq(data)),
    onSuccess: () => invalidate(client),
  });
};

export const useUpdateRfq = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RfqUpdateDto }) =>
      unwrapServiceResult(rfqService.updateRfq(id, data)),
    onSuccess: () => invalidate(client),
  });
};

export const useDeleteRfq = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrapServiceResult(rfqService.deleteRfq(id)),
    onSuccess: () => invalidate(client),
  });
};

export const useUpdateRfqStatus = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      unwrapServiceResult(rfqService.updateStatus(id, status)),
    onSuccess: () => invalidate(client),
  });
};

export const useRecordRfqQuote = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      supplierId,
      data,
    }: {
      id: string;
      supplierId: string;
      data: RfqSupplierQuoteDto;
    }) => unwrapServiceResult(rfqService.recordQuote(id, supplierId, data)),
    onSuccess: () => invalidate(client),
  });
};

export const useAwardRfq = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      supplierId,
      data,
    }: {
      id: string;
      supplierId: string;
      data: AwardRfqDto;
    }) => unwrapServiceResult(rfqService.awardRfq(id, supplierId, data)),
    onSuccess: () => {
      invalidate(client);
      client.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });
};
