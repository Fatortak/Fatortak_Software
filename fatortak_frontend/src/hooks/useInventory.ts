import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "../services/inventoryService";
import { unwrapServiceResult } from "../services/api";
import {
  PaginationDto,
  StockAdjustmentCreateDto,
  StockAdjustmentFilterDto,
} from "../types/api";

export const useInventoryValuation = () =>
  useQuery({
    queryKey: ["inventory-valuation"],
    queryFn: () => inventoryService.getValuation(),
  });

export const useStockAdjustments = (
  pagination: PaginationDto,
  filters?: StockAdjustmentFilterDto
) =>
  useQuery({
    queryKey: ["stock-adjustments", pagination, filters],
    queryFn: () => inventoryService.getAdjustments(pagination, filters),
  });

export const useCreateStockAdjustment = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: StockAdjustmentCreateDto) =>
      unwrapServiceResult(inventoryService.createAdjustment(data)),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["stock-adjustments"] });
      client.invalidateQueries({ queryKey: ["inventory-valuation"] });
      client.invalidateQueries({ queryKey: ["items"] });
    },
  });
};
