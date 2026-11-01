import { apiClient } from "./api";
import { SavedViewCreateDto, SavedViewDto } from "../types/api";

export const savedViewService = {
  getViews: (pageKey: string) =>
    apiClient.get<SavedViewDto[]>("/api/saved-views", { pageKey }),
  create: (data: SavedViewCreateDto) =>
    apiClient.post<SavedViewDto>("/api/saved-views", data),
  update: (id: string, data: Omit<SavedViewCreateDto, "pageKey">) =>
    apiClient.post<SavedViewDto>(`/api/saved-views/update/${id}`, data),
  delete: (id: string) =>
    apiClient.post<boolean>(`/api/saved-views/delete/${id}`),
};
