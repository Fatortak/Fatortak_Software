import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pricingService } from "../services/pricingService";
import { unwrapServiceResult } from "../services/api";
import {
  PaginationDto,
  PriceListCreateDto,
  PriceListFilterDto,
  PriceListUpdateDto,
} from "../types/api";

export const usePriceLists = (
  pagination: PaginationDto,
  filters?: PriceListFilterDto
) =>
  useQuery({
    queryKey: ["price-lists", pagination, filters],
    queryFn: () => pricingService.getPriceLists(pagination, filters),
  });

const invalidate = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: ["price-lists"] });
};

export const useCreatePriceList = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: PriceListCreateDto) =>
      unwrapServiceResult(pricingService.createPriceList(data)),
    onSuccess: () => invalidate(client),
  });
};

export const useUpdatePriceList = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PriceListUpdateDto }) =>
      unwrapServiceResult(pricingService.updatePriceList(id, data)),
    onSuccess: () => invalidate(client),
  });
};

export const useDeletePriceList = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(pricingService.deletePriceList(id)),
    onSuccess: () => invalidate(client),
  });
};

export const useAssignPriceListCustomer = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, customerId }: { id: string; customerId: string }) =>
      unwrapServiceResult(pricingService.assignCustomer(id, customerId)),
    onSuccess: () => invalidate(client),
  });
};

export const useUnassignPriceListCustomer = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, customerId }: { id: string; customerId: string }) =>
      unwrapServiceResult(pricingService.unassignCustomer(id, customerId)),
    onSuccess: () => invalidate(client),
  });
};
