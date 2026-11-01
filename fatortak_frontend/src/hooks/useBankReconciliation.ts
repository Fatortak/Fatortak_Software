import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bankReconciliationService } from "../services/bankReconciliationService";
import { unwrapServiceResult } from "../services/api";
import {
  BankStatementFilterDto,
  BankStatementImportDto,
  PaginationDto,
} from "../types/api";

export const useBankStatements = (
  pagination: PaginationDto,
  filters?: BankStatementFilterDto
) =>
  useQuery({
    queryKey: ["bank-statements", pagination, filters],
    queryFn: () => bankReconciliationService.getStatements(pagination, filters),
  });

export const useBankStatement = (id?: string) =>
  useQuery({
    queryKey: ["bank-statement", id],
    queryFn: () => bankReconciliationService.getStatement(id!),
    enabled: !!id,
  });

const invalidate = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: ["bank-statements"] });
  client.invalidateQueries({ queryKey: ["bank-statement"] });
};

export const useImportBankStatement = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: BankStatementImportDto) =>
      unwrapServiceResult(bankReconciliationService.importStatement(data)),
    onSuccess: () => invalidate(client),
  });
};

export const useMatchBankLine = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      statementId,
      lineId,
      transactionId,
    }: {
      statementId: string;
      lineId: string;
      transactionId: string;
    }) =>
      unwrapServiceResult(
        bankReconciliationService.match(statementId, lineId, transactionId)
      ),
    onSuccess: () => invalidate(client),
  });
};

export const useUnmatchBankLine = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ statementId, lineId }: { statementId: string; lineId: string }) =>
      unwrapServiceResult(bankReconciliationService.unmatch(statementId, lineId)),
    onSuccess: () => invalidate(client),
  });
};

export const useToggleIgnoreBankLine = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ statementId, lineId }: { statementId: string; lineId: string }) =>
      unwrapServiceResult(bankReconciliationService.ignore(statementId, lineId)),
    onSuccess: () => invalidate(client),
  });
};

export const useBankAdjustment = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ statementId, lineId }: { statementId: string; lineId: string }) =>
      unwrapServiceResult(
        bankReconciliationService.adjustment(statementId, lineId)
      ),
    onSuccess: () => invalidate(client),
  });
};

export const useReconcileBankStatement = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (statementId: string) =>
      unwrapServiceResult(bankReconciliationService.reconcile(statementId)),
    onSuccess: () => invalidate(client),
  });
};

export const useDeleteBankStatement = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (statementId: string) =>
      unwrapServiceResult(bankReconciliationService.delete(statementId)),
    onSuccess: () => invalidate(client),
  });
};

export const fetchBankCandidates = async (statementId: string, lineId: string) =>
  unwrapServiceResult(
    bankReconciliationService.candidates(statementId, lineId)
  );
