import { apiClient } from "./api";
import type {
  RegistrationOptionsDto,
  SubdomainAvailabilityDto,
} from "../types/api";

export const registrationService = {
  getOptions: () => apiClient.get<RegistrationOptionsDto>("/api/auth/registration-options"),
  checkSubdomain: (value: string) => {
    const params = new URLSearchParams({ value });
    return apiClient.get<SubdomainAvailabilityDto>(
      `/api/auth/subdomain-availability?${params.toString()}`
    );
  },
};
