import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileCheck2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateSupplierBill } from "@/hooks/usePurchaseOrders";
import { formatCurrency } from "@/Helpers/formatCurrency";
import FormErrorSummary, { FormErrorItem } from "@/components/forms/FormErrorSummary";
import type { PurchaseOrderDto } from "@/types/api";

interface Props {
  isOpen: boolean;
  order: PurchaseOrderDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface BillRow {
  quantity: number;
  unitPrice: number;
}

const SupplierBillModal: React.FC<Props> = ({ isOpen, order, onClose, onSuccess }) => {
  const { isRTL } = useLanguage();
  const createMutation = useCreateSupplierBill();
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Record<string, BillRow>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen || !order) return;
    setSupplierInvoiceNumber("");
    setIssueDate(new Date().toISOString().slice(0, 10));
    setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setNotes("");
    setRows(
      Object.fromEntries(
        order.items.map((item) => [
          item.id,
          { quantity: item.remainingToBill, unitPrice: item.unitPrice },
        ])
      )
    );
  }, [isOpen, order]);

  const billableItems = useMemo(
    () => order?.items.filter((item) => item.remainingToBill > 0) || [],
    [order]
  );

  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    let variance = 0;
    billableItems.forEach((item) => {
      const row = rows[item.id];
      if (!row || row.quantity <= 0) return;
      const net = row.quantity * row.unitPrice * (1 - item.discount);
      subtotal += row.quantity * row.unitPrice;
      vat += net * (item.vatRate || 0);
      variance += (row.unitPrice - item.unitPrice) * row.quantity;
    });
    return { subtotal, vat, variance };
  }, [billableItems, rows]);

  const submit = async () => {
    if (!order) return;
    const nextErrors: Record<string, string> = {};
    if (!supplierInvoiceNumber.trim()) {
      nextErrors.supplierInvoiceNumber = isRTL
        ? "رقم فاتورة المورد مطلوب"
        : "Supplier invoice number is required";
    }
    if (!issueDate) {
      nextErrors.issueDate = isRTL ? "تاريخ الفاتورة مطلوب" : "Invoice date is required";
    }
    if (!dueDate) {
      nextErrors.dueDate = isRTL ? "تاريخ الاستحقاق مطلوب" : "Due date is required";
    } else if (issueDate && new Date(dueDate) < new Date(issueDate)) {
      nextErrors.dueDate = isRTL
        ? "الاستحقاق يجب أن يكون بعد تاريخ الفاتورة"
        : "Due date must be on or after the invoice date";
    }

    const items = billableItems
      .map((item) => ({
        item,
        row: rows[item.id],
      }))
      .filter(({ row }) => row && row.quantity > 0)
      .map(({ item, row }) => ({
        purchaseOrderItemId: item.id,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        vatRate: item.vatRate,
        discount: item.discount,
      }));

    if (items.length === 0) {
      nextErrors.items = isRTL
        ? "أدخل كمية واحدة على الأقل"
        : "Enter at least one billed quantity";
    }
    if (items.some((item) => item.quantity < 0 || item.unitPrice < 0)) {
      nextErrors.items = isRTL
        ? "الكميات والأسعار يجب ألا تكون سالبة"
        : "Quantities and prices cannot be negative";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(isRTL ? "راجع الحقول المطلوبة" : "Review the highlighted fields");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        id: order.id,
        data: {
          supplierInvoiceNumber: supplierInvoiceNumber.trim(),
          issueDate,
          dueDate,
          notes,
          items,
        },
      });
      toast.success(
        isRTL
          ? `تم تسجيل فاتورة المورد ${result.data?.invoiceNumber}`
          : `Supplier bill ${result.data?.invoiceNumber} recorded`
      );
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Could not record supplier bill");
    }
  };

  const errorSummary: FormErrorItem[] = Object.entries(errors).map(
    ([field, message]) => ({ field, message })
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-brand-600" />
            {isRTL ? "تسجيل فاتورة مورد" : "Record supplier bill"}
            {order && <span className="text-sm font-normal text-slate-500">— {order.poNumber}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <FormErrorSummary errors={errorSummary} />
          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
            <div className="space-y-1.5">
              <Label>{isRTL ? "رقم فاتورة المورد" : "Supplier invoice number"} *</Label>
              <Input
                value={supplierInvoiceNumber}
                onChange={(e) => {
                  setSupplierInvoiceNumber(e.target.value);
                  setErrors((prev) => ({ ...prev, supplierInvoiceNumber: "" }));
                }}
                placeholder={isRTL ? "مثال: INV-9042" : "e.g. INV-9042"}
                aria-label={isRTL ? "رقم فاتورة المورد" : "Supplier invoice number"}
                aria-invalid={!!errors.supplierInvoiceNumber}
                className={errors.supplierInvoiceNumber ? "border-rose-300 dark:border-rose-700" : ""}
              />
              {errors.supplierInvoiceNumber && (
                <p className="text-xs text-rose-600">{errors.supplierInvoiceNumber}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "تاريخ الفاتورة" : "Invoice date"}</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                aria-label={isRTL ? "تاريخ الفاتورة" : "Invoice date"}
                aria-invalid={!!errors.issueDate}
                className={errors.issueDate ? "border-rose-300 dark:border-rose-700" : ""}
              />
              {errors.issueDate && <p className="text-xs text-rose-600">{errors.issueDate}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "تاريخ الاستحقاق" : "Due date"}</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label={isRTL ? "تاريخ الاستحقاق" : "Due date"}
                aria-invalid={!!errors.dueDate}
                className={errors.dueDate ? "border-rose-300 dark:border-rose-700" : ""}
              />
              {errors.dueDate && <p className="text-xs text-rose-600">{errors.dueDate}</p>}
            </div>
          </div>

          {billableItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {isRTL
                ? "كل الكميات المستلمة تمت فوترتها بالفعل."
                : "All received quantities have already been billed."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-start">{isRTL ? "البند" : "Item"}</th>
                    <th className="px-3 py-2 text-end">{isRTL ? "متبقي للفاتورة" : "Billable"}</th>
                    <th className="px-3 py-2 text-end">{isRTL ? "الكمية" : "Qty"}</th>
                    <th className="px-3 py-2 text-end">{isRTL ? "سعر أمر الشراء" : "PO price"}</th>
                    <th className="px-3 py-2 text-end">{isRTL ? "سعر الفاتورة" : "Bill price"}</th>
                    <th className="px-3 py-2 text-end">{isRTL ? "الإجمالي" : "Total"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {billableItems.map((item) => {
                    const row = rows[item.id] || { quantity: 0, unitPrice: item.unitPrice };
                    const net = row.quantity * row.unitPrice * (1 - item.discount);
                    return (
                      <tr key={item.id}>
                        <td className="px-3 py-2">{item.description}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{item.remainingToBill}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            max={item.remainingToBill}
                            value={row.quantity}
                            onChange={(e) =>
                              setRows((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...row,
                                  quantity: Number(e.target.value) || 0,
                                },
                              }))
                            }
                            className="ms-auto h-8 w-20 px-2 text-end"
                            aria-label={`${isRTL ? "كمية" : "Quantity"} ${item.description}`}
                          />
                        </td>
                        <td className="px-3 py-2 text-end tabular-nums">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.unitPrice}
                            onChange={(e) =>
                              setRows((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...row,
                                  unitPrice: Number(e.target.value) || 0,
                                },
                              }))
                            }
                            className="ms-auto h-8 w-24 px-2 text-end"
                            aria-label={`${isRTL ? "سعر" : "Price"} ${item.description}`}
                          />
                        </td>
                        <td className="px-3 py-2 text-end font-medium tabular-nums">
                          {formatCurrency(net + net * (item.vatRate || 0))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totals.variance !== 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {isRTL
                  ? `فرق سعري عن أمر الشراء: ${formatCurrency(totals.variance)}`
                  : `Price variance against the purchase order: ${formatCurrency(totals.variance)}`}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{isRTL ? "ملاحظات" : "Notes"}</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              aria-label={isRTL ? "ملاحظات" : "Notes"}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div><p className="text-xs text-slate-400">{isRTL ? "قبل الضريبة" : "Subtotal"}</p><p className="font-medium tabular-nums">{formatCurrency(totals.subtotal)}</p></div>
            <div><p className="text-xs text-slate-400">{isRTL ? "الضريبة" : "VAT"}</p><p className="font-medium tabular-nums">{formatCurrency(totals.vat)}</p></div>
            <div><p className="text-xs text-slate-400">{isRTL ? "الإجمالي" : "Total"}</p><p className="font-semibold tabular-nums">{formatCurrency(totals.subtotal + totals.vat)}</p></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{isRTL ? "إلغاء" : "Cancel"}</Button>
          <Button
            onClick={submit}
            loading={createMutation.isPending}
            disabled={billableItems.length === 0}
          >
            {isRTL ? "تسجيل الفاتورة" : "Record bill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierBillModal;
