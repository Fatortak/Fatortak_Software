import { apiClient } from "./api";
import { UserSessionDto } from "../types/api";

export const sessionService = {
  getSessions: () => apiClient.get<UserSessionDto[]>("/api/sessions"),
  revoke: (sessionId: string) =>
    apiClient.post<boolean>(`/api/sessions/${sessionId}/revoke`),
  revokeOthers: () =>
    apiClient.post<number>("/api/sessions/revoke-others"),
};
