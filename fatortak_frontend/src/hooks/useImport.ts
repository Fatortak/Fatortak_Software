import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importService } from "../services/importService";
import { unwrapServiceResult } from "../services/api";
import { ImportExecuteDto } from "../types/api";

export const usePreviewImport = () =>
  useMutation({
    mutationFn: ({
      file,
      entityType,
      isSupplier,
    }: {
      file: File;
      entityType: string;
      isSupplier: boolean;
    }) =>
      unwrapServiceResult(
        importService.preview(file, entityType, isSupplier)
      ),
  });

export const useExecuteImport = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportExecuteDto) =>
      unwrapServiceResult(importService.execute(data)),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["customers"] });
      client.invalidateQueries({ queryKey: ["items"] });
      client.invalidateQueries({ queryKey: ["inventory-valuation"] });
    },
  });
};

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
