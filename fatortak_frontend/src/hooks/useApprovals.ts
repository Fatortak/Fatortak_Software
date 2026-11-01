import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approvalService } from "../services/approvalService";
import { unwrapServiceResult } from "../services/api";
import {
  ApprovalDecisionDto,
  ApprovalPolicyDto,
  ApprovalRequestCreateDto,
  ApprovalRequestFilterDto,
  PaginationDto,
} from "../types/api";

export const useApprovals = (
  pagination: PaginationDto,
  filters?: ApprovalRequestFilterDto
) =>
  useQuery({
    queryKey: ["approvals", pagination, filters],
    queryFn: () => approvalService.getRequests(pagination, filters),
  });

export const useApprovalCandidates = (documentType: string) =>
  useQuery({
    queryKey: ["approval-candidates", documentType],
    queryFn: () => approvalService.getCandidates(documentType),
    enabled: !!documentType,
  });

const invalidate = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: ["approvals"] });
  client.invalidateQueries({ queryKey: ["approval-candidates"] });
};

export const useCreateApproval = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: ApprovalRequestCreateDto) =>
      unwrapServiceResult(approvalService.createRequest(data)),
    onSuccess: () => invalidate(client),
  });
};

export const useApproveRequest = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApprovalDecisionDto }) =>
      unwrapServiceResult(approvalService.approve(id, data)),
    onSuccess: () => invalidate(client),
  });
};

export const useRejectRequest = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApprovalDecisionDto }) =>
      unwrapServiceResult(approvalService.reject(id, data)),
    onSuccess: () => invalidate(client),
  });
};

export const useCancelApproval = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrapServiceResult(approvalService.cancel(id)),
    onSuccess: () => invalidate(client),
  });
};

export const useApprovalPolicies = () =>
  useQuery({
    queryKey: ["approval-policies"],
    queryFn: () => approvalService.getPolicies(),
  });

export const useSaveApprovalPolicy = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: ApprovalPolicyDto) =>
      unwrapServiceResult(approvalService.savePolicy(data)),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["approval-policies"] });
    },
  });
};
