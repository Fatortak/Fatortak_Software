import React, { useEffect, useMemo, useState } from "react";
import { MessageSquareQuote } from "lucide-react";
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
import { useRecordRfqQuote } from "@/hooks/useRfqs";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { RfqDto, RfqSupplierDto } from "@/types/api";

interface Props {
  isOpen: boolean;
  rfq: RfqDto | null;
  supplier: RfqSupplierDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RfqQuoteModal: React.FC<Props> = ({
  isOpen,
  rfq,
  supplier,
  onClose,
  onSuccess,
}) => {
  const { isRTL } = useLanguage();
  const quoteMutation = useRecordRfqQuote();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isOpen || !rfq || !supplier) return;
    const existing = Object.fromEntries(
      supplier.items.map((item) => [item.rfqItemId, item.unitPrice])
    );
    setPrices(
      Object.fromEntries(
        rfq.items.map((item) => [
          item.id,
          existing[item.id] ?? item.targetUnitPrice,
        ])
      )
    );
    setValidUntil(
      supplier.validUntil
        ? supplier.validUntil.slice(0, 10)
        : new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
    );
    setNotes(supplier.notes || "");
  }, [isOpen, rfq, supplier]);

  const total = useMemo(
    () =>
      rfq?.items.reduce(
        (sum, item) => sum + item.quantity * (prices[item.id] || 0),
        0
      ) || 0,
    [rfq, prices]
  );

  const submit = async () => {
    if (!rfq || !supplier) return;
    try {
      await quoteMutation.mutateAsync({
        id: rfq.id,
        supplierId: supplier.supplierId,
        data: {
          validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
          notes,
          items: rfq.items.map((item) => ({
            rfqItemId: item.id,
            unitPrice: prices[item.id] || 0,
          })),
        },
      });
      toast.success(isRTL ? "تم حفظ عرض المورد" : "Supplier quote saved");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Could not save supplier quote");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-brand-600" />
            {supplier?.supplierName} — {isRTL ? "عرض مورد" : "Supplier quote"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{isRTL ? "صالح حتى" : "Valid until"}</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                aria-label={isRTL ? "صالح حتى" : "Valid until"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "ملاحظات المورد" : "Supplier notes"}</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isRTL ? "شروط أو ملاحظات" : "Terms or notes"}
                aria-label={isRTL ? "ملاحظات المورد" : "Supplier notes"}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-start">{isRTL ? "البند" : "Item"}</th>
                  <th className="px-3 py-2 text-end">{isRTL ? "الكمية" : "Qty"}</th>
                  <th className="px-3 py-2 text-end">{isRTL ? "سعر الوحدة" : "Unit price"}</th>
                  <th className="px-3 py-2 text-end">{isRTL ? "الإجمالي" : "Total"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rfq?.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{item.quantity}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={prices[item.id] ?? 0}
                        onChange={(e) =>
                          setPrices((prev) => ({
                            ...prev,
                            [item.id]: Number(e.target.value) || 0,
                          }))
                        }
                        className="ms-auto h-8 w-28 px-2 text-end"
                        aria-label={`${isRTL ? "سعر" : "Price"} ${item.description}`}
                      />
                    </td>
                    <td className="px-3 py-2 text-end font-medium tabular-nums">
                      {formatCurrency(item.quantity * (prices[item.id] || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {isRTL ? "إجمالي العرض" : "Quote total"}
            </span>
            <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={submit} loading={quoteMutation.isPending}>
            {isRTL ? "حفظ العرض" : "Save quote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RfqQuoteModal;
