import { apiClient, ServiceResult } from "./api";

export type StakeholderType = "Shareholder" | "Partner" | "Investor";
export type StakeholderTransactionType =
  | "CapitalContribution"
  | "Dividend"
  | "LoanReceived"
  | "LoanRepayment"
  | "Withdrawal";

export interface StakeholderDto {
  id: string;
  name: string;
  type: StakeholderType;
  email?: string;
  phone?: string;
  ownershipPercent: number;
  accountId?: string;
  accountName?: string;
  notes?: string;
  isActive: boolean;
  capitalBalance: number;
  loanBalance: number;
  netPosition: number;
  transactionCount: number;
  createdAt: string;
}

export interface StakeholderTransactionDto {
  id: string;
  stakeholderId: string;
  stakeholderName: string;
  type: StakeholderTransactionType;
  amount: number;
  date: string;
  paymentAccountId?: string;
  paymentAccountName?: string;
  journalEntryId?: string;
  reference?: string;
  description?: string;
  createdAt: string;
}

export interface StakeholderInput {
  name: string;
  type: StakeholderType;
  email?: string;
  phone?: string;
  ownershipPercent: number;
  accountId?: string;
  notes?: string;
  isActive: boolean;
}

export interface StakeholderTransactionInput {
  type: StakeholderTransactionType;
  amount: number;
  date: string;
  paymentAccountId?: string;
  reference?: string;
  description?: string;
}

export const stakeholderService = {
  getAll: () => apiClient.get<StakeholderDto[]>("/api/stakeholders"),
  getById: (id: string) =>
    apiClient.get<StakeholderDto>(`/api/stakeholders/${id}`),
  create: (data: StakeholderInput) =>
    apiClient.post<StakeholderDto>("/api/stakeholders", data),
  update: (id: string, data: StakeholderInput) =>
    apiClient.put<StakeholderDto>(`/api/stakeholders/${id}`, data),
  remove: (id: string) =>
    apiClient.delete<boolean>(`/api/stakeholders/${id}`),
  getTransactions: (id: string) =>
    apiClient.get<StakeholderTransactionDto[]>(
      `/api/stakeholders/${id}/transactions`
    ),
  addTransaction: (id: string, data: StakeholderTransactionInput) =>
    apiClient.post<StakeholderTransactionDto>(
      `/api/stakeholders/${id}/transactions`,
      data
    ),
  removeTransaction: (transactionId: string) =>
    apiClient.delete<boolean>(`/api/stakeholders/transactions/${transactionId}`),
  exportStatement: (id: string) =>
    apiClient.getBlob(`/api/stakeholders/${id}/statement/export`),
};

export type { ServiceResult };
