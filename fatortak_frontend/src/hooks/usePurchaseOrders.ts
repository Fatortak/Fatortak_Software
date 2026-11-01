import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { purchaseOrderService } from "../services/purchaseOrderService";
import { unwrapServiceResult } from "../services/api";
import {
  PaginationDto,
  PurchaseOrderCreateDto,
  PurchaseOrderFilterDto,
  PurchaseOrderUpdateDto,
  SupplierBillCreateDto,
} from "../types/api";

export const usePurchaseOrders = (
  pagination: PaginationDto,
  filters?: PurchaseOrderFilterDto
) =>
  useQuery({
    queryKey: ["purchase-orders", pagination, filters],
    queryFn: () => purchaseOrderService.getPurchaseOrders(pagination, filters),
  });

export const usePurchaseOrder = (id?: string) =>
  useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => purchaseOrderService.getPurchaseOrder(id!),
    enabled: !!id,
  });

const invalidate = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: ["purchase-orders"] });
  client.invalidateQueries({ queryKey: ["purchase-order"] });
  client.invalidateQueries({ queryKey: ["goods-receipts"] });
};

export const useCreatePurchaseOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: PurchaseOrderCreateDto) =>
      unwrapServiceResult(purchaseOrderService.createPurchaseOrder(data)),
    onSuccess: () => invalidate(client),
  });
};

export const useUpdatePurchaseOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PurchaseOrderUpdateDto }) =>
      unwrapServiceResult(purchaseOrderService.updatePurchaseOrder(id, data)),
    onSuccess: () => invalidate(client),
  });
};

export const useDeletePurchaseOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(purchaseOrderService.deletePurchaseOrder(id)),
    onSuccess: () => invalidate(client),
  });
};

export const useUpdatePurchaseOrderStatus = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      unwrapServiceResult(purchaseOrderService.updateStatus(id, status)),
    onSuccess: () => invalidate(client),
  });
};

export const useSupplierBillMatching = (id?: string) =>
  useQuery({
    queryKey: ["purchase-order-bills", id],
    queryFn: () => purchaseOrderService.getSupplierBills(id!),
    enabled: !!id,
  });

export const useCreateSupplierBill = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplierBillCreateDto }) =>
      unwrapServiceResult(purchaseOrderService.createSupplierBill(id, data)),
    onSuccess: () => {
      invalidate(client);
      client.invalidateQueries({ queryKey: ["purchase-order-bills"] });
      client.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};
