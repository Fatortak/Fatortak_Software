import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseRequisitionService } from "../services/purchaseRequisitionService";
import { unwrapServiceResult } from "../services/api";
import {
  PaginationDto,
  PurchaseRequisitionCreateDto,
  PurchaseRequisitionFilterDto,
} from "../types/api";

export const usePurchaseRequisitions = (
  pagination: PaginationDto,
  filters?: PurchaseRequisitionFilterDto
) =>
  useQuery({
    queryKey: ["purchase-requisitions", pagination, filters],
    queryFn: () =>
      purchaseRequisitionService.getRequisitions(pagination, filters),
  });

const invalidate = (client: ReturnType<typeof useQueryClient>) =>
  client.invalidateQueries({ queryKey: ["purchase-requisitions"] });

export const useCreatePurchaseRequisition = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: PurchaseRequisitionCreateDto) =>
      unwrapServiceResult(purchaseRequisitionService.createRequisition(data)),
    onSuccess: () => invalidate(client),
  });
};

export const useUpdatePurchaseRequisitionStatus = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      unwrapServiceResult(
        purchaseRequisitionService.updateStatus(id, status)
      ),
    onSuccess: () => invalidate(client),
  });
};

export const useDeletePurchaseRequisition = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(purchaseRequisitionService.deleteRequisition(id)),
    onSuccess: () => invalidate(client),
  });
};
