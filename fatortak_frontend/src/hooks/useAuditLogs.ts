import { useQuery } from "@tanstack/react-query";
import { auditService } from "../services/auditService";
import { AuditLogFilterDto, PaginationDto } from "../types/api";

export const useAuditLogs = (
  pagination: PaginationDto,
  filters?: AuditLogFilterDto
) =>
  useQuery({
    queryKey: ["audit-logs", pagination, filters],
    queryFn: () => auditService.getLogs(pagination, filters),
  });
