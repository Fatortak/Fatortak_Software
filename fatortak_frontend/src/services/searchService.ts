import { apiClient } from "./api";
import { GlobalSearchResultDto } from "../types/api";

export const searchService = {
  search: (term: string) =>
    apiClient.get<GlobalSearchResultDto[]>("/api/search", { term }),
};
