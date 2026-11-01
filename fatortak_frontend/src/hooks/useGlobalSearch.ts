import { useQuery } from "@tanstack/react-query";
import { searchService } from "../services/searchService";

export const useGlobalSearch = (term: string) =>
  useQuery({
    queryKey: ["global-search", term],
    queryFn: () => searchService.search(term),
    enabled: term.trim().length >= 2,
    staleTime: 10_000,
  });
