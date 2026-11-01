import { useQuery } from "@tanstack/react-query";
import { documentService } from "../services/documentService";

export const useDocumentRevisions = (
  documentType: string,
  documentId?: string,
  enabled = true
) =>
  useQuery({
    queryKey: ["document-revisions", documentType, documentId],
    queryFn: () => documentService.getRevisions(documentType, documentId!),
    enabled: enabled && !!documentId,
  });
