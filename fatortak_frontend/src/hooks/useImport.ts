import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importService } from "../services/importService";
import { unwrapServiceResult } from "../services/api";

export const useImportCustomers = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ csv, isSupplier }: { csv: string; isSupplier: boolean }) =>
      unwrapServiceResult(importService.importCustomers(csv, isSupplier)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["customers"] }),
  });
};

export const useImportItems = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (csv: string) =>
      unwrapServiceResult(importService.importItems(csv)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["items"] }),
  });
};
