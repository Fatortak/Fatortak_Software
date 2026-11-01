import React, { useEffect, useMemo, useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
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
import { useCreateRecurringInvoice } from "@/hooks/useRecurringInvoices";
import { useCustomers } from "@/hooks/useCustomers";
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

const RecurringInvoiceModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { isRTL } = useLanguage();
  const createMutation = useCreateRecurringInvoice();
  const { data: customerResponse } = useCustomers({
    pageNumber: 1,
    pageSize: 200,
  });
  const customers = customerResponse?.success
    ? customerResponse.data?.data || []
    : [];

  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [dueDays, setDueDays] = useState(30);
  const [autoSend, setAutoSend] = useState(false);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([newLine()]);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setCustomerId("");
    setFrequency("Monthly");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setDueDays(30);
    setAutoSend(false);
    setNotes("");
    setLines([newLine()]);
  }, [isOpen]);

  const total = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const net = line.quantity * line.unitPrice * (1 - line.discountPercent / 100);
        const vat = line.vatRate === "" ? 0 : Number(line.vatRate) || 0;
        return sum + net + net * vat;
      }, 0),
    [lines]
  );

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );

  const submit = async () => {
    if (!name.trim()) {
      toast.error(isRTL ? "أدخل اسم الجدولة" : "Enter a schedule name");
      return;
    }
    if (!customerId) {
      toast.error(isRTL ? "اختر العميل" : "Select a customer");
      return;
    }
    const valid = lines.filter((line) => line.description.trim() && line.quantity > 0);
    if (valid.length === 0) {
      toast.error(isRTL ? "أضف بنداً واحداً على الأقل" : "Add at least one line");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        customerId,
        invoiceType: "Sell",
        frequency,
        startDate,
        endDate: endDate || undefined,
        dueDays,
        autoSend,
        notes,
        items: valid.map((line) => ({
          description: line.description.trim(),
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          vatRate: line.vatRate === "" ? undefined : Number(line.vatRate),
          discount: line.discountPercent / 100,
        })),
      });
      toast.success(isRTL ? "تم إنشاء الجدولة" : "Recurring invoice created");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Could not create recurring invoice");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand-600" />
            {isRTL ? "جدولة فاتورة متكررة" : "New recurring invoice"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1.4fr_1.2fr_1fr]">
            <div className="space-y-1.5">
              <Label>{isRTL ? "اسم الجدولة" : "Schedule name"} *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isRTL ? "مثال: صيانة شهرية" : "e.g. Monthly retainer"}
                aria-label={isRTL ? "اسم الجدولة" : "Schedule name"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "العميل" : "Customer"} *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger aria-label={isRTL ? "العميل" : "Customer"}>
                  <SelectValue placeholder={isRTL ? "اختر العميل" : "Select customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "التكرار" : "Frequency"}</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger aria-label={isRTL ? "التكرار" : "Frequency"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">{isRTL ? "أسبوعي" : "Weekly"}</SelectItem>
                  <SelectItem value="Monthly">{isRTL ? "شهري" : "Monthly"}</SelectItem>
                  <SelectItem value="Quarterly">{isRTL ? "ربع سنوي" : "Quarterly"}</SelectItem>
                  <SelectItem value="Yearly">{isRTL ? "سنوي" : "Yearly"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>{isRTL ? "البداية" : "Start date"}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label={isRTL ? "البداية" : "Start date"} />
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "النهاية (اختياري)" : "End date (optional)"}</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label={isRTL ? "النهاية" : "End date"} />
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "أيام الاستحقاق" : "Due days"}</Label>
              <Input type="number" min={0} max={365} value={dueDays} onChange={(e) => setDueDays(Number(e.target.value) || 0)} aria-label={isRTL ? "أيام الاستحقاق" : "Due days"} />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} />
              {isRTL ? "إرسال تلقائي" : "Auto-send"}
            </label>
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
                  <Input value={line.description} onChange={(e) => updateLine(line.key, { description: e.target.value })} placeholder={isRTL ? "وصف البند" : "Line description"} className="h-9" aria-label={isRTL ? "وصف البند" : "Line description"} />
                  <Input type="number" min={1} value={line.quantity} onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 0 })} className="h-9 px-1" aria-label={isRTL ? "الكمية" : "Quantity"} />
                  <Input type="number" min={0} step="0.01" value={line.unitPrice} onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) || 0 })} className="h-9 px-2" aria-label={isRTL ? "سعر الوحدة" : "Unit price"} />
                  <Input type="number" min={0} max={1} step="0.01" value={line.vatRate} onChange={(e) => updateLine(line.key, { vatRate: e.target.value })} placeholder="0.14" className="h-9 px-2" aria-label={isRTL ? "نسبة الضريبة" : "VAT rate"} />
                  <Input type="number" min={0} max={100} step="1" value={line.discountPercent} onChange={(e) => updateLine(line.key, { discountPercent: Number(e.target.value) || 0 })} className="h-9 px-2" aria-label={isRTL ? "نسبة الخصم" : "Discount percent"} />
                  <span className="text-end text-sm tabular-nums text-slate-700 dark:text-slate-300">{formatCurrency(net + net * rate)}</span>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={lines.length === 1} onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))} aria-label={isRTL ? "حذف البند" : "Remove line"}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                </div>
              );
            })}
            <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => setLines((prev) => [...prev, newLine()])}><Plus className="h-4 w-4" />{isRTL ? "إضافة بند" : "Add line"}</Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{isRTL ? "ملاحظات" : "Notes"}</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} aria-label={isRTL ? "ملاحظات" : "Notes"} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? "قيمة الفاتورة" : "Invoice value"}</span>
            <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{isRTL ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={submit} loading={createMutation.isPending}>{isRTL ? "إنشاء الجدولة" : "Create schedule"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringInvoiceModal;
