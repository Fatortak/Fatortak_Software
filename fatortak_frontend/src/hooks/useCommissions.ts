import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commissionService } from "../services/commissionService";
import { unwrapServiceResult } from "../services/api";
import {
  CommissionFilterDto,
  CommissionRuleCreateDto,
  CommissionRuleUpdateDto,
  GenerateCommissionDto,
  PaginationDto,
} from "../types/api";

export const useCommissionRules = () =>
  useQuery({
    queryKey: ["commission-rules"],
    queryFn: () => commissionService.getRules(),
  });

export const useCommissions = (
  pagination: PaginationDto,
  filters?: CommissionFilterDto
) =>
  useQuery({
    queryKey: ["commissions", pagination, filters],
    queryFn: () => commissionService.getCommissions(pagination, filters),
  });

const invalidate = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: ["commission-rules"] });
  client.invalidateQueries({ queryKey: ["commissions"] });
};

export const useCreateCommissionRule = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: CommissionRuleCreateDto) =>
      unwrapServiceResult(commissionService.createRule(data)),
    onSuccess: () => invalidate(client),
  });
};

export const useUpdateCommissionRule = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CommissionRuleUpdateDto }) =>
      unwrapServiceResult(commissionService.updateRule(id, data)),
    onSuccess: () => invalidate(client),
  });
};

export const useDeleteCommissionRule = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(commissionService.deleteRule(id)),
    onSuccess: () => invalidate(client),
  });
};

export const useGenerateCommission = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateCommissionDto) =>
      unwrapServiceResult(commissionService.generate(data)),
    onSuccess: () => invalidate(client),
  });
};

export const useApproveCommission = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(commissionService.approve(id)),
    onSuccess: () => invalidate(client),
  });
};

export const usePayCommission = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrapServiceResult(commissionService.pay(id)),
    onSuccess: () => invalidate(client),
  });
};

export const useCancelCommission = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrapServiceResult(commissionService.cancel(id)),
    onSuccess: () => invalidate(client),
  });
};
