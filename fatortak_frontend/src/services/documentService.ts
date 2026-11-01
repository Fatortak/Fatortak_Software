import { apiClient } from "./api";
import { DocumentRevisionDto } from "../types/api";

export const documentService = {
  getRevisions: (documentType: string, documentId: string) =>
    apiClient.get<DocumentRevisionDto[]>(
      `/api/documents/${documentType}/${documentId}/revisions`
    ),
};
