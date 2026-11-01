import React, { useEffect, useMemo, useState } from "react";
import { FileMinus2, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateInvoiceNote } from "@/hooks/useInvoiceNotes";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCurrency } from "@/Helpers/formatCurrency";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Line {
  key: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: string;
  discountPercent: number;
}

const newLine = (): Line => ({
  key: Math.random().toString(36).slice(2),
  description: "",
  quantity: 1,
  unitPrice: 0,
  vatRate: "",
  discountPercent: 0,
});

const InvoiceNoteModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { isRTL } = useLanguage();
  const createMutation = useCreateInvoiceNote();
  const { data: invoiceResponse } = useInvoices({ pageNumber: 1, pageSize: 200 });
  const invoices = invoiceResponse?.success
    ? invoiceResponse.data?.data || []
    : [];

  const [originalInvoiceId, setOriginalInvoiceId] = useState("");
  const [noteType, setNoteType] = useState<"Credit" | "Debit">("Credit");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([newLine()]);

  useEffect(() => {
    if (!isOpen) return;
    setOriginalInvoiceId("");
    setNoteType("Credit");
    setIssueDate(new Date().toISOString().slice(0, 10));
    setReason("");
    setNotes("");
    setLines([newLine()]);
  }, [isOpen]);

  const sign = noteType === "Credit" ? -1 : 1;

  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    let discount = 0;
    lines.forEach((line) => {
      const net = line.quantity * line.unitPrice * (1 - line.discountPercent / 100);
      const rate = line.vatRate === "" ? 0 : Number(line.vatRate) || 0;
      subtotal += line.quantity * line.unitPrice;
      discount += line.quantity * line.unitPrice * (line.discountPercent / 100);
      vat += net * rate;
    });
    return {
      subtotal: sign * subtotal,
      vat: sign * vat,
      discount: sign * discount,
      total: sign * (subtotal + vat - discount),
    };
  }, [lines, sign]);

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );

  const submit = async () => {
    if (!originalInvoiceId) {
      toast.error(isRTL ? "اختر الفاتورة الأصلية" : "Select the original invoice");
      return;
    }
    if (!reason.trim()) {
      toast.error(isRTL ? "أدخل سبب الإشعار" : "Enter the note reason");
      return;
    }
    const valid = lines.filter((line) => line.description.trim() && line.quantity > 0);
    if (valid.length === 0) {
      toast.error(isRTL ? "أضف بنداً واحداً على الأقل" : "Add at least one line");
      return;
    }
    try {
      await createMutation.mutateAsync({
        originalInvoiceId,
        noteType,
        issueDate,
        reason: reason.trim(),
        notes,
        items: valid.map((line) => ({
          description: line.description.trim(),
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          vatRate: line.vatRate === "" ? undefined : Number(line.vatRate),
          discount: line.discountPercent / 100,
        })),
      });
      toast.success(isRTL ? "تم إنشاء الإشعار" : "Credit/debit note created");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Could not create note");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileMinus2 className="h-5 w-5 text-brand-600" />
            {isRTL ? "إشعار دائن / مدين جديد" : "New credit / debit note"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr_1fr]">
            <div className="space-y-1.5">
              <Label>{isRTL ? "الفاتورة الأصلية" : "Original invoice"} *</Label>
              <Select value={originalInvoiceId} onValueChange={setOriginalInvoiceId}>
                <SelectTrigger aria-label={isRTL ? "الفاتورة الأصلية" : "Original invoice"}>
                  <SelectValue placeholder={isRTL ? "اختر الفاتورة" : "Select invoice"} />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} — {invoice.customerName} ({formatCurrency(invoice.total)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "نوع الإشعار" : "Note type"}</Label>
              <Select value={noteType} onValueChange={(v) => setNoteType(v as "Credit" | "Debit")}>
                <SelectTrigger aria-label={isRTL ? "نوع الإشعار" : "Note type"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit">{isRTL ? "إشعار دائن" : "Credit note"}</SelectItem>
                  <SelectItem value="Debit">{isRTL ? "إشعار مدين" : "Debit note"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "التاريخ" : "Issue date"}</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                aria-label={isRTL ? "التاريخ" : "Issue date"}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{isRTL ? "السبب" : "Reason"} *</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isRTL ? "مثال: مرتجع أو خصم اتفاقي" : "e.g. returned goods or agreed discount"}
              aria-label={isRTL ? "السبب" : "Reason"}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid min-w-[720px] grid-cols-[minmax(0,1fr)_70px_105px_80px_80px_100px_36px] gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <span>{isRTL ? "الوصف" : "Description"}</span>
              <span>{isRTL ? "الكمية" : "Qty"}</span>
              <span>{isRTL ? "السعر" : "Price"}</span>
              <span>{isRTL ? "ضريبة" : "VAT"}</span>
              <span>{isRTL ? "خصم %" : "Disc %"}</span>
              <span>{isRTL ? "الإجمالي" : "Total"}</span>
              <span />
            </div>
            {lines.map((line) => {
              const net = line.quantity * line.unitPrice * (1 - line.discountPercent / 100);
              const rate = line.vatRate === "" ? 0 : Number(line.vatRate) || 0;
              return (
                <div key={line.key} className="grid min-w-[720px] grid-cols-[minmax(0,1fr)_70px_105px_80px_80px_100px_36px] items-center gap-2 px-3 py-2">
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(line.key, { description: e.target.value })}
                    placeholder={isRTL ? "وصف البند" : "Line description"}
                    className="h-9"
                    aria-label={isRTL ? "وصف البند" : "Line description"}
                  />
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 0 })}
                    className="h-9 px-1"
                    aria-label={isRTL ? "الكمية" : "Quantity"}
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) || 0 })}
                    className="h-9 px-2"
                    aria-label={isRTL ? "سعر الوحدة" : "Unit price"}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step="0.01"
                    value={line.vatRate}
                    onChange={(e) => updateLine(line.key, { vatRate: e.target.value })}
                    placeholder="0.14"
                    className="h-9 px-2"
                    aria-label={isRTL ? "نسبة الضريبة" : "VAT rate"}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    value={line.discountPercent}
                    onChange={(e) => updateLine(line.key, { discountPercent: Number(e.target.value) || 0 })}
                    className="h-9 px-2"
                    aria-label={isRTL ? "نسبة الخصم" : "Discount percent"}
                  />
                  <span className="text-end text-sm tabular-nums text-slate-700 dark:text-slate-300">
                    {formatCurrency(sign * (net + net * rate))}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={lines.length === 1}
                    onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                    aria-label={isRTL ? "حذف البند" : "Remove line"}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              );
            })}
            <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => setLines((prev) => [...prev, newLine()])}>
                <Plus className="h-4 w-4" />
                {isRTL ? "إضافة بند" : "Add line"}
              </Button>
            </div>
          </div>

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
            <div><p className="text-xs text-slate-400">{isRTL ? "الإجمالي" : "Total"}</p><p className="font-semibold tabular-nums">{formatCurrency(totals.total)}</p></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{isRTL ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={submit} loading={createMutation.isPending}>
            {isRTL ? "إنشاء الإشعار" : "Create note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceNoteModal;
