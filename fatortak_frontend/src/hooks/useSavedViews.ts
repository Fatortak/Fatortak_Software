import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savedViewService } from "../services/savedViewService";
import { unwrapServiceResult } from "../services/api";
import { SavedViewCreateDto } from "../types/api";

export const useSavedViews = (pageKey: string) =>
  useQuery({
    queryKey: ["saved-views", pageKey],
    queryFn: () => savedViewService.getViews(pageKey),
  });

export const useCreateSavedView = (pageKey: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: SavedViewCreateDto) =>
      unwrapServiceResult(savedViewService.create(data)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["saved-views", pageKey] }),
  });
};

export const useUpdateSavedView = (pageKey: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Omit<SavedViewCreateDto, "pageKey">;
    }) => unwrapServiceResult(savedViewService.update(id, data)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["saved-views", pageKey] }),
  });
};

export const useDeleteSavedView = (pageKey: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrapServiceResult(savedViewService.delete(id)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["saved-views", pageKey] }),
  });
};
