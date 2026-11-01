import { useQuery } from "@tanstack/react-query";
import { taxService } from "../services/taxService";

export const useVatReturn = (fromDate: string, toDate: string) =>
  useQuery({
    queryKey: ["vat-return", fromDate, toDate],
    queryFn: () => taxService.getVatReturn(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  });

export const useEInvoices = (fromDate: string, toDate: string) =>
  useQuery({
    queryKey: ["e-invoices", fromDate, toDate],
    queryFn: () => taxService.getEInvoices(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  });
