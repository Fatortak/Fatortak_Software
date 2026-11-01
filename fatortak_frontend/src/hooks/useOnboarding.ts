import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { onboardingService } from "../services/onboardingService";
import { unwrapServiceResult } from "../services/api";

export const useOnboarding = () =>
  useQuery({
    queryKey: ["onboarding"],
    queryFn: () => onboardingService.getProgress(),
  });

export const useSeedDemoData = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => unwrapServiceResult(onboardingService.seedDemoData()),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["onboarding"] });
      client.invalidateQueries({ queryKey: ["customers"] });
      client.invalidateQueries({ queryKey: ["items"] });
      client.invalidateQueries({ queryKey: ["quotations"] });
      client.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
