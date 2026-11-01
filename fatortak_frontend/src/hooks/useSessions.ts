import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionService } from "../services/sessionService";
import { unwrapServiceResult } from "../services/api";

export const useUserSessions = () =>
  useQuery({
    queryKey: ["user-sessions"],
    queryFn: () => sessionService.getSessions(),
  });

export const useRevokeSession = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      unwrapServiceResult(sessionService.revoke(sessionId)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["user-sessions"] }),
  });
};

export const useRevokeOtherSessions = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => unwrapServiceResult(sessionService.revokeOthers()),
    onSuccess: () => client.invalidateQueries({ queryKey: ["user-sessions"] }),
  });
};
