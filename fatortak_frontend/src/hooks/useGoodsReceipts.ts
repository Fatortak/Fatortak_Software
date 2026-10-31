import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { goodsReceiptService } from "../services/goodsReceiptService";
import { unwrapServiceResult } from "../services/api";
import {
  GoodsReceiptCreateDto,
  GoodsReceiptFilterDto,
  GoodsReceiptUpdateDto,
  PaginationDto,
} from "../types/api";

export const useGoodsReceipts = (
  pagination: PaginationDto,
  filters?: GoodsReceiptFilterDto
) =>
  useQuery({
    queryKey: ["goods-receipts", pagination, filters],
    queryFn: () => goodsReceiptService.getGoodsReceipts(pagination, filters),
  });

export const useGoodsReceipt = (id?: string) =>
  useQuery({
    queryKey: ["goods-receipt", id],
    queryFn: () => goodsReceiptService.getGoodsReceipt(id!),
    enabled: !!id,
  });

const invalidate = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: ["goods-receipts"] });
  client.invalidateQueries({ queryKey: ["goods-receipt"] });
  client.invalidateQueries({ queryKey: ["purchase-orders"] });
  client.invalidateQueries({ queryKey: ["purchase-order"] });
  client.invalidateQueries({ queryKey: ["items"] });
};

export const useCreateGoodsReceipt = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: GoodsReceiptCreateDto) =>
      unwrapServiceResult(goodsReceiptService.createGoodsReceipt(data)),
    onSuccess: () => invalidate(client),
  });
};

export const useUpdateGoodsReceipt = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GoodsReceiptUpdateDto }) =>
      unwrapServiceResult(goodsReceiptService.updateGoodsReceipt(id, data)),
    onSuccess: () => invalidate(client),
  });
};

export const usePostGoodsReceipt = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(goodsReceiptService.postGoodsReceipt(id)),
    onSuccess: () => invalidate(client),
  });
};

export const useUpdateGoodsReceiptStatus = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      unwrapServiceResult(goodsReceiptService.updateStatus(id, status)),
    onSuccess: () => invalidate(client),
  });
};

export const useDeleteGoodsReceipt = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(goodsReceiptService.deleteGoodsReceipt(id)),
    onSuccess: () => invalidate(client),
  });
};
