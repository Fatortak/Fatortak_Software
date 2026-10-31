import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
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
import { useCreateRfq } from "@/hooks/useRfqs";
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
  targetUnitPrice: number;
}

const newLine = (): Line => ({
  key: Math.random().toString(36).slice(2),
  description: "",
  quantity: 1,
  targetUnitPrice: 0,
});

const RfqModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { isRTL } = useLanguage();
  const createMutation = useCreateRfq();
  const { data: supplierResponse } = useCustomers(
    { pageNumber: 1, pageSize: 100 },
    { isSupplier: true, isActive: true }
  );
  const suppliers = supplierResponse?.success
    ? supplierResponse.data?.data || []
    : [];

  const [title, setTitle] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [lines, setLines] = useState<Line[]>([newLine()]);

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setIssueDate(new Date().toISOString().slice(0, 10));
    setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
    setNotes("");
    setSelectedSuppliers([]);
    setLines([newLine()]);
  }, [isOpen]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity * line.targetUnitPrice, 0),
    [lines]
  );

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );

  const toggleSupplier = (id: string) =>
    setSelectedSuppliers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const submit = async () => {
    if (!title.trim()) {
      toast.error(isRTL ? "أدخل عنوان طلب العرض" : "Enter an RFQ title");
      return;
    }
    if (selectedSuppliers.length === 0) {
      toast.error(isRTL ? "اختر مورداً واحداً على الأقل" : "Select at least one supplier");
      return;
    }
    const valid = lines.filter((line) => line.description.trim() && line.quantity > 0);
    if (valid.length === 0) {
      toast.error(isRTL ? "أضف بنداً واحداً على الأقل" : "Add at least one line");
      return;
    }
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        issueDate,
        dueDate,
        notes,
        supplierIds: selectedSuppliers,
        items: valid.map((line) => ({
          description: line.description.trim(),
          quantity: line.quantity,
          targetUnitPrice: line.targetUnitPrice,
        })),
      });
      toast.success(isRTL ? "تم إنشاء طلب العرض" : "RFQ created");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Could not create RFQ");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brand-600" />
            {isRTL ? "طلب عرض سعر جديد" : "New request for quotation"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr_1fr]">
            <div className="space-y-1.5">
              <Label>{isRTL ? "عنوان طلب العرض" : "RFQ title"} *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isRTL ? "مثال: مستلزمات مطبخ" : "e.g. Kitchen supplies"}
                aria-label={isRTL ? "عنوان طلب العرض" : "RFQ title"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "تاريخ الإصدار" : "Issue date"}</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                aria-label={isRTL ? "تاريخ الإصدار" : "Issue date"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "آخر موعد" : "Due date"}</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label={isRTL ? "آخر موعد" : "Due date"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isRTL ? "الموردون المدعوون" : "Invited suppliers"} *</Label>
            {suppliers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {isRTL
                  ? "أضف مورداً من صفحة الموردين أولاً."
                  : "Add a supplier from the suppliers page first."}
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {suppliers.map((supplier) => (
                  <label
                    key={supplier.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-600"
                      checked={selectedSuppliers.includes(supplier.id)}
                      onChange={() => toggleSupplier(supplier.id)}
                    />
                    <span className="truncate">{supplier.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid min-w-[620px] grid-cols-[minmax(0,1fr)_80px_120px_110px_36px] gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <span>{isRTL ? "الوصف" : "Description"}</span>
              <span>{isRTL ? "الكمية" : "Qty"}</span>
              <span>{isRTL ? "السعر المستهدف" : "Target price"}</span>
              <span>{isRTL ? "الإجمالي" : "Total"}</span>
              <span />
            </div>
            {lines.map((line) => (
              <div
                key={line.key}
                className="grid min-w-[620px] grid-cols-[minmax(0,1fr)_80px_120px_110px_36px] items-center gap-2 px-3 py-2"
              >
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
                  className="h-9 px-2"
                  aria-label={isRTL ? "الكمية" : "Quantity"}
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.targetUnitPrice}
                  onChange={(e) => updateLine(line.key, { targetUnitPrice: Number(e.target.value) || 0 })}
                  className="h-9 px-2"
                  aria-label={isRTL ? "السعر المستهدف" : "Target unit price"}
                />
                <span className="text-end text-sm tabular-nums text-slate-700 dark:text-slate-300">
                  {formatCurrency(line.quantity * line.targetUnitPrice)}
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
            ))}
            <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLines((prev) => [...prev, newLine()])}
              >
                <Plus className="h-4 w-4" />
                {isRTL ? "إضافة بند" : "Add line"}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{isRTL ? "ملاحظات" : "Notes"}</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                aria-label={isRTL ? "ملاحظات" : "Notes"}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {isRTL ? "القيمة المستهدفة" : "Target value"}
              </span>
              <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={submit} loading={createMutation.isPending}>
            {isRTL ? "إنشاء طلب العرض" : "Create RFQ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RfqModal;
