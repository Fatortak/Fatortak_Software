import { apiClient } from "./api";
import { DemoDataResultDto, OnboardingProgressDto } from "../types/api";

export const onboardingService = {
  getProgress: () => apiClient.get<OnboardingProgressDto>("/api/onboarding"),
  seedDemoData: () =>
    apiClient.post<DemoDataResultDto>("/api/onboarding/demo-data"),
};
