import React, { useEffect, useMemo, useState } from "react";
import { PackagePlus, Plus, Trash2 } from "lucide-react";
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
import { useCreatePurchaseOrder } from "@/hooks/usePurchaseOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { useItems } from "@/hooks/useItems";
import { formatCurrency } from "@/Helpers/formatCurrency";
import FormErrorSummary, { FormErrorItem } from "@/components/forms/FormErrorSummary";
import { isDateRangeValid, isNonNegativeNumber, isPercentage, isPositiveNumber } from "@/lib/validation";
import type { ItemDto } from "@/types/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Line {
  key: string;
  itemId?: string;
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

const PurchaseOrderModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { isRTL } = useLanguage();
  const createMutation = useCreatePurchaseOrder();
  const { data: supplierResponse } = useCustomers(
    { pageNumber: 1, pageSize: 100 },
    { isSupplier: true, isActive: true }
  );
  const { data: itemResponse } = useItems({ pageNumber: 1, pageSize: 200 });
  const suppliers = supplierResponse?.success
    ? supplierResponse.data?.data || []
    : [];
  const items: ItemDto[] = itemResponse?.success ? itemResponse.data?.data || [] : [];

  const [supplierId, setSupplierId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setSupplierId("");
    setIssueDate(new Date().toISOString().slice(0, 10));
    setExpectedDate(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
    setNotes("");
    setTerms("");
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

  const addCatalogItem = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setLines((prev) => {
      const blank = prev.find((line) => !line.description.trim());
      const line: Line = {
        key: blank?.key || Math.random().toString(36).slice(2),
        itemId: item.id,
        description: item.name,
        quantity: 1,
        unitPrice: item.purchaseUnitPrice ?? item.unitPrice ?? 0,
        vatRate: item.vatRate !== undefined && item.vatRate !== null ? String(item.vatRate) : "",
        discountPercent: 0,
      };
      return blank ? prev.map((l) => (l.key === blank.key ? line : l)) : [...prev, line];
    });
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!supplierId) {
      nextErrors.supplierId = isRTL ? "اختر المورد" : "Choose a supplier";
    }
    if (!issueDate) {
      nextErrors.issueDate = isRTL ? "تاريخ الإصدار مطلوب" : "Issue date is required";
    }
    if (!expectedDate) {
      nextErrors.expectedDate = isRTL ? "تاريخ التسليم مطلوب" : "Expected date is required";
    } else if (issueDate && !isDateRangeValid(issueDate, expectedDate)) {
      nextErrors.expectedDate = isRTL
        ? "التسليم يجب أن يكون بعد الإصدار"
        : "Delivery must be on or after the issue date";
    }

    const valid = lines.filter((line) => {
      if (!line.description.trim()) return false;
      if (!isPositiveNumber(line.quantity)) return false;
      if (!isNonNegativeNumber(line.unitPrice)) return false;
      if (line.discountPercent !== undefined && !isPercentage(line.discountPercent)) return false;
      if (line.vatRate !== "" && line.vatRate !== undefined && !isPercentage(Number(line.vatRate))) return false;
      return true;
    });
    if (valid.length === 0) {
      nextErrors.lines = isRTL
        ? "أضف بنداً صالحاً واحداً على الأقل"
        : "Add at least one valid line";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(isRTL ? "راجع الحقول المطلوبة" : "Review the highlighted fields");
      return;
    }

    try {
      await createMutation.mutateAsync({
        supplierId,
        issueDate,
        expectedDate,
        notes,
        terms,
        items: valid.map((line) => ({
          itemId: line.itemId,
          description: line.description.trim(),
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          vatRate: line.vatRate === "" ? undefined : Number(line.vatRate),
          discount: line.discountPercent / 100,
        })),
      });
      toast.success(isRTL ? "تم إنشاء أمر الشراء" : "Purchase order created");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Could not create purchase order");
    }
  };

  const errorSummary: FormErrorItem[] = useMemo(
    () => Object.entries(errors).map(([field, message]) => ({ field, message })),
    [errors]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-brand-600" />
            {isRTL ? "أمر شراء جديد" : "New purchase order"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <FormErrorSummary errors={errorSummary} />
          <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr_1fr]">
            <div className="space-y-1.5">
              <Label>{isRTL ? "المورد" : "Supplier"} *</Label>
              <Select value={supplierId} onValueChange={(value) => { setSupplierId(value); setErrors((prev) => ({ ...prev, supplierId: "" })); }}>
                <SelectTrigger aria-label={isRTL ? "المورد" : "Supplier"} aria-invalid={!!errors.supplierId} className={errors.supplierId ? "border-rose-300 dark:border-rose-700" : ""}>
                  <SelectValue placeholder={isRTL ? "اختر المورد" : "Select supplier"} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierId && <p className="text-xs text-rose-600">{errors.supplierId}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "تاريخ الإصدار" : "Issue date"}</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => { setIssueDate(e.target.value); setErrors((prev) => ({ ...prev, issueDate: "" })); }}
                aria-label={isRTL ? "تاريخ الإصدار" : "Issue date"}
                aria-invalid={!!errors.issueDate}
                className={errors.issueDate ? "border-rose-300 dark:border-rose-700" : ""}
              />
              {errors.issueDate && <p className="text-xs text-rose-600">{errors.issueDate}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "التسليم المتوقع" : "Expected date"}</Label>
              <Input
                type="date"
                value={expectedDate}
                onChange={(e) => { setExpectedDate(e.target.value); setErrors((prev) => ({ ...prev, expectedDate: "" })); }}
                aria-label={isRTL ? "التسليم المتوقع" : "Expected date"}
                aria-invalid={!!errors.expectedDate}
                className={errors.expectedDate ? "border-rose-300 dark:border-rose-700" : ""}
              />
              {errors.expectedDate && <p className="text-xs text-rose-600">{errors.expectedDate}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label>{isRTL ? "إضافة من المخزون" : "Add from inventory"}</Label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) addCatalogItem(e.target.value);
                  e.target.value = "";
                }}
                aria-label={isRTL ? "إضافة من المخزون" : "Add from inventory"}
              >
                <option value="">{isRTL ? "اختر صنفاً..." : "Choose an item..."}</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {formatCurrency(item.purchaseUnitPrice ?? item.unitPrice ?? 0)}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:max-w-[280px]">
              {isRTL
                ? "ربط الصنف بالمخزون يجعل استلام البضاعة يحدّث الكمية والتكلفة."
                : "Linking an inventory item lets goods receipt update stock and cost."}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid min-w-[760px] grid-cols-[minmax(0,1fr)_70px_105px_80px_80px_100px_36px] gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
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
              const vat = line.vatRate === "" ? 0 : Number(line.vatRate) || 0;
              return (
                <div
                  key={line.key}
                  className="grid min-w-[760px] grid-cols-[minmax(0,1fr)_70px_105px_80px_80px_100px_36px] items-center gap-2 px-3 py-2"
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
                    {formatCurrency(net + net * vat)}
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
                rows={2}
                aria-label={isRTL ? "ملاحظات" : "Notes"}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "الشروط" : "Terms"}</Label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
                aria-label={isRTL ? "الشروط" : "Terms"}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {isRTL ? "إجمالي أمر الشراء" : "Purchase order total"}
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
          <Button onClick={submit} loading={createMutation.isPending}>
            {isRTL ? "إنشاء أمر الشراء" : "Create order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseOrderModal;
