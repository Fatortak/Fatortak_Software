import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkService } from "../services/bulkService";
import { unwrapServiceResult } from "../services/api";

export const useBulkDeleteCustomers = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      unwrapServiceResult(bulkService.deleteCustomers(ids)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["customers"] }),
  });
};

export const useBulkActivateCustomers = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      unwrapServiceResult(bulkService.activateCustomers(ids, isActive)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["customers"] }),
  });
};

export const useBulkDeleteItems = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      unwrapServiceResult(bulkService.deleteItems(ids)),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["items"] });
      client.invalidateQueries({ queryKey: ["inventory-valuation"] });
    },
  });
};

export const useBulkActivateItems = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      unwrapServiceResult(bulkService.activateItems(ids, isActive)),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["items"] });
      client.invalidateQueries({ queryKey: ["inventory-valuation"] });
    },
  });
};
