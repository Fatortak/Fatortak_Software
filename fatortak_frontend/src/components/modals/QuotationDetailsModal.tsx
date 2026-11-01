import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  FileText,
  History,
  Printer,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrentCompany } from "@/hooks/useCompanies";
import { useConvertQuotation } from "@/hooks/useQuotations";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { QuotationDto } from "@/types/api";
import DocumentHistoryDialog from "./DocumentHistoryDialog";

interface QuotationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: QuotationDto | null;
}

const statusTone = (status: string) => {
  switch (status) {
    case "Accepted":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Sent":
      return "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
    case "Converted":
      return "border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300";
    case "Confirmed":
      return "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
    case "Invoiced":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Delivered":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Rejected":
    case "Expired":
      return "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300";
    case "Cancelled":
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }
};

const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({
  isOpen,
  onClose,
  quotation,
}) => {
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = useState(false);
  const { data: companyResponse } = useCurrentCompany();
  const convertMutation = useConvertQuotation();
  const company = companyResponse?.data;

  if (!quotation) return null;

  const canConvert =
    !quotation.convertedInvoiceId &&
    !quotation.isExpired &&
    !["Converted", "Invoiced", "Rejected", "Cancelled", "Expired"].includes(quotation.status);

  const handleConvert = async () => {
    try {
      const result = await convertMutation.mutateAsync({ id: quotation.id });
      const invoice = result.data;
      if (invoice) {
        toast.success(
          isRTL
            ? `تم إنشاء الفاتورة ${invoice.invoiceNumber}`
            : `Invoice ${invoice.invoiceNumber} created`
        );
      }
      onClose();
      navigate("/sell-invoices");
    } catch (error: any) {
      toast.error(error?.message || (isRTL ? "تعذر التحويل" : "Could not convert quotation"));
    }
  };

  const money = (value: number) => `${formatCurrency(value)} ${quotation.currency || "EGP"}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex flex-wrap items-start justify-between gap-3 pe-10">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600" />
                {quotation.quotationNumber}
              </DialogTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {quotation.documentType === "SalesOrder"
                  ? isRTL ? "أمر بيع" : "Sales order"
                  : quotation.documentType === "DeliveryNote"
                    ? isRTL ? "إذن تسليم" : "Delivery note"
                    : isRTL ? "عرض سعر" : "Quotation"}
              </p>
            </div>
            <Badge className={statusTone(quotation.status)}>
              {quotation.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="print-area space-y-5">
          <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {isRTL ? "من" : "From"}
              </p>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Building2 className="h-4 w-4 text-brand-600" />
                {company?.name || "Fatortak"}
              </p>
              {company?.phone && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{company.phone}</p>
              )}
              {company?.email && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{company.email}</p>
              )}
            </div>
            <div className="space-y-1 sm:text-end">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {isRTL ? "إلى" : "Prepared for"}
              </p>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 sm:justify-end dark:text-white">
                <User className="h-4 w-4 text-brand-600" />
                {quotation.customerName}
              </p>
              {quotation.customerPhoneNumber && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {quotation.customerPhoneNumber}
                </p>
              )}
              {quotation.projectName && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {quotation.projectName}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  {isRTL ? "تاريخ العرض" : "Issued"}
                </p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {new Date(quotation.issueDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  {isRTL ? "صالح حتى" : "Valid until"}
                </p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {new Date(quotation.validUntil).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <FileText className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  {isRTL ? "الحالة" : "Status"}
                </p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{quotation.status}</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-start">{isRTL ? "البند" : "Item"}</th>
                  <th className="px-3 py-2 text-end">{isRTL ? "الكمية" : "Qty"}</th>
                  <th className="px-3 py-2 text-end">{isRTL ? "السعر" : "Price"}</th>
                  <th className="px-3 py-2 text-end">{isRTL ? "الخصم" : "Disc."}</th>
                  <th className="px-3 py-2 text-end">{isRTL ? "الضريبة" : "VAT"}</th>
                  <th className="px-3 py-2 text-end">{isRTL ? "الإجمالي" : "Total"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quotation.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200">
                      {item.description || item.itemName}
                    </td>
                    <td className="px-3 py-2.5 text-end tabular-nums">{item.quantity}</td>
                    <td className="px-3 py-2.5 text-end tabular-nums">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-end tabular-nums">
                      {((item.discount || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5 text-end tabular-nums">
                      {((item.vatRate || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5 text-end font-medium tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-md space-y-2 text-sm text-slate-500 dark:text-slate-400">
              {quotation.notes && (
                <p>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {isRTL ? "ملاحظات: " : "Notes: "}
                  </span>
                  {quotation.notes}
                </p>
              )}
              {quotation.terms && (
                <p>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {isRTL ? "الشروط: " : "Terms: "}
                  </span>
                  {quotation.terms}
                </p>
              )}
            </div>
            <div className="w-full space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm sm:w-64 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{isRTL ? "الإجمالي الفرعي" : "Subtotal"}</span>
                <span className="tabular-nums">{money(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{isRTL ? "الخصم" : "Discount"}</span>
                <span className="tabular-nums">- {money(quotation.totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{isRTL ? "الضريبة" : "VAT"}</span>
                <span className="tabular-nums">{money(quotation.vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                <span>{isRTL ? "الإجمالي" : "Total"}</span>
                <span className="tabular-nums">{money(quotation.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={onClose}>
            {t("close") || "Close"}
          </Button>
          <Button variant="outline" onClick={() => setHistoryOpen(true)}>
            <History className="h-4 w-4" />
            {isRTL ? "الإصدارات" : "History"}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {isRTL ? "طباعة" : "Print"}
          </Button>
          {canConvert && (
            <Button onClick={handleConvert} loading={convertMutation.isPending}>
              {isRTL ? "تحويل إلى فاتورة" : "Convert to invoice"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      <DocumentHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        documentType="Quotation"
        documentId={quotation.id}
        documentNumber={quotation.quotationNumber}
      />
    </Dialog>
  );
};

export default QuotationDetailsModal;
