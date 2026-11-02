import React, { useEffect, useMemo, useState } from "react";
import { Plus, Tags, Trash2 } from "lucide-react";
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
import { useCreatePriceList, useUpdatePriceList } from "@/hooks/usePricing";
import { useItems } from "@/hooks/useItems";
import { formatCurrency } from "@/Helpers/formatCurrency";
import FormField from "@/components/forms/FormField";
import FormErrorSummary, { FormErrorItem } from "@/components/forms/FormErrorSummary";
import type { PriceListDto } from "@/types/api";

interface Props {
  isOpen: boolean;
  priceList?: PriceListDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface Line {
  key: string;
  itemId: string;
  unitPrice: number;
  minQuantity: number;
  maxQuantity: string;
}

const newLine = (): Line => ({
  key: Math.random().toString(36).slice(2),
  itemId: "",
  unitPrice: 0,
  minQuantity: 1,
  maxQuantity: "",
});

const PriceListModal: React.FC<Props> = ({ isOpen, priceList, onClose, onSuccess }) => {
  const { isRTL } = useLanguage();
  const createMutation = useCreatePriceList();
  const updateMutation = useUpdatePriceList();
  const { data: itemResponse } = useItems({ pageNumber: 1, pageSize: 300 });
  const items = itemResponse?.success ? itemResponse.data?.data || [] : [];

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("");
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lineErrors, setLineErrors] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (!isOpen) return;
    setName(priceList?.name || "");
    setCurrency(priceList?.currency || "");
    setValidFrom((priceList?.validFrom || new Date().toISOString()).slice(0, 10));
    setValidTo(priceList?.validTo ? priceList.validTo.slice(0, 10) : "");
    setIsActive(priceList?.isActive ?? true);
    setIsDefault(priceList?.isDefault ?? false);
    setNotes(priceList?.notes || "");
    setLines(
      priceList && priceList.items.length > 0
        ? priceList.items.map((item) => ({
            key: Math.random().toString(36).slice(2),
            itemId: item.itemId,
            unitPrice: item.unitPrice,
            minQuantity: item.minQuantity,
            maxQuantity: item.maxQuantity ? String(item.maxQuantity) : "",
          }))
        : [newLine()]
    );
  }, [isOpen, priceList]);

  const totalLines = useMemo(
    () => lines.filter((line) => line.itemId && line.unitPrice >= 0).length,
    [lines]
  );

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );

  const errorSummary: FormErrorItem[] = useMemo(
    () => [
      ...Object.entries(errors).map(([field, message]) => ({ field, message })),
      ...Object.entries(lineErrors).flatMap(([key, issues]) =>
        Object.entries(issues).map(([field, message]) => ({
          field: `${key}-${field}`,
          message,
        }))
      ),
    ],
    [errors, lineErrors]
  );

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    const nextLineErrors: Record<string, Record<string, string>> = {};

    if (!name.trim()) {
      nextErrors.name = isRTL ? "اسم القائمة مطلوب" : "Price list name is required";
    }
    if (validTo && validFrom && new Date(validTo).getTime() < new Date(validFrom).getTime()) {
      nextErrors.validTo = isRTL
        ? "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية"
        : "Valid-to must be on or after valid-from";
    }

    const valid = lines.filter((line) => {
      const issues: Record<string, string> = {};
      if (!line.itemId) issues.itemId = isRTL ? "اختر الصنف" : "Choose an item";
      if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0)
        issues.unitPrice = isRTL ? "سعر غير صالح" : "Invalid price";
      if (!Number.isFinite(line.minQuantity) || line.minQuantity < 1)
        issues.minQuantity = isRTL ? "1 على الأقل" : "At least 1";
      if (
        line.maxQuantity &&
        Number(line.maxQuantity) < line.minQuantity
      )
        issues.maxQuantity = isRTL
          ? "يجب أن يكون ≥ الحد الأدنى"
          : "Must be ≥ minimum";
      if (Object.keys(issues).length > 0) nextLineErrors[line.key] = issues;
      return Object.keys(issues).length === 0;
    });

    if (valid.length === 0) {
      nextErrors.lines = isRTL
        ? "أضف بند سعر صالحاً واحداً على الأقل"
        : "Add at least one valid price line";
    }

    const overlaps = valid.some((line, index) =>
      valid.slice(index + 1).some((other) => {
        if (line.itemId !== other.itemId) return false;
        const lineMax = line.maxQuantity ? Number(line.maxQuantity) : Infinity;
        const otherMax = other.maxQuantity ? Number(other.maxQuantity) : Infinity;
        return line.minQuantity <= otherMax && other.minQuantity <= lineMax;
      })
    );
    if (overlaps) {
      nextErrors.lines = isRTL
        ? "توجد نطاقات كمية متداخلة لنفس الصنف"
        : "Quantity ranges overlap for the same item";
    }

    setErrors(nextErrors);
    setLineErrors(nextLineErrors);
    if (Object.keys(nextErrors).length > 0 || Object.keys(nextLineErrors).length > 0) {
      toast.error(isRTL ? "راجع الحقول المطلوبة" : "Review the highlighted fields");
      return;
    }

    const payload = {
      name: name.trim(),
      currency: currency || undefined,
      validFrom,
      validTo: validTo || undefined,
      isActive,
      isDefault,
      notes,
      items: valid.map((line) => ({
        itemId: line.itemId,
        unitPrice: line.unitPrice,
        minQuantity: line.minQuantity || 1,
        maxQuantity: line.maxQuantity ? Number(line.maxQuantity) : undefined,
      })),
    };
    try {
      if (priceList) {
        await updateMutation.mutateAsync({ id: priceList.id, data: payload });
        toast.success(isRTL ? "تم تحديث قائمة الأسعار" : "Price list updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(isRTL ? "تم إنشاء قائمة الأسعار" : "Price list created");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Could not save price list");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-brand-600" />
            {priceList ? (isRTL ? "تعديل قائمة الأسعار" : "Edit price list") : (isRTL ? "قائمة أسعار جديدة" : "New price list")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <FormErrorSummary errors={errorSummary} />
          <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <FormField label={isRTL ? "الاسم" : "Name"} required error={errors.name}>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                aria-invalid={!!errors.name}
                className={errors.name ? "border-rose-300 dark:border-rose-700" : ""}
                placeholder={isRTL ? "مثال: قائمة التجزئة" : "e.g. Retail price list"}
                aria-label={isRTL ? "الاسم" : "Name"}
              />
            </FormField>
            <FormField label={isRTL ? "العملة" : "Currency"}>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="EGP" aria-label={isRTL ? "العملة" : "Currency"} />
            </FormField>
            <FormField label={isRTL ? "تبدأ" : "Valid from"}>
              <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} aria-label={isRTL ? "تبدأ" : "Valid from"} />
            </FormField>
            <FormField label={isRTL ? "تنتهي" : "Valid to"} error={errors.validTo}>
              <Input
                type="date"
                value={validTo}
                onChange={(e) => {
                  setValidTo(e.target.value);
                  if (errors.validTo) setErrors((prev) => ({ ...prev, validTo: "" }));
                }}
                aria-invalid={!!errors.validTo}
                className={errors.validTo ? "border-rose-300 dark:border-rose-700" : ""}
                aria-label={isRTL ? "تنتهي" : "Valid to"}
              />
            </FormField>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              {isRTL ? "نشطة" : "Active"}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
              {isRTL ? "افتراضية" : "Default list"}
            </label>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid min-w-[680px] grid-cols-[minmax(0,1.7fr)_110px_80px_80px_36px] gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <span>{isRTL ? "الصنف" : "Item"}</span>
              <span>{isRTL ? "السعر" : "Price"}</span>
              <span>{isRTL ? "أدنى كمية" : "Min qty"}</span>
              <span>{isRTL ? "أقصى كمية" : "Max qty"}</span>
              <span />
            </div>
            {lines.map((line) => (
              <div key={line.key} className="grid min-w-[680px] grid-cols-[minmax(0,1.7fr)_110px_80px_80px_36px] items-center gap-2 px-3 py-2">
                <Select value={line.itemId} onValueChange={(value) => {
                  const item = items.find((i) => i.id === value);
                  updateLine(line.key, { itemId: value, unitPrice: item?.unitPrice ?? line.unitPrice });
                }}>
                  <SelectTrigger className={`h-9 ${lineErrors[line.key]?.itemId ? "border-rose-300 dark:border-rose-700" : ""}`} aria-label={isRTL ? "الصنف" : "Item"} aria-invalid={!!lineErrors[line.key]?.itemId}>
                    <SelectValue placeholder={isRTL ? "اختر الصنف" : "Choose item"} />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" min={0} step="0.01" value={line.unitPrice} onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) || 0 })} className={`h-9 px-2 ${lineErrors[line.key]?.unitPrice ? "border-rose-300 dark:border-rose-700" : ""}`} aria-label={isRTL ? "السعر" : "Price"} aria-invalid={!!lineErrors[line.key]?.unitPrice} />
                <Input type="number" min={1} value={line.minQuantity} onChange={(e) => updateLine(line.key, { minQuantity: Number(e.target.value) || 1 })} className={`h-9 px-2 ${lineErrors[line.key]?.minQuantity ? "border-rose-300 dark:border-rose-700" : ""}`} aria-label={isRTL ? "أدنى كمية" : "Minimum quantity"} aria-invalid={!!lineErrors[line.key]?.minQuantity} />
                <Input type="number" min={1} value={line.maxQuantity} onChange={(e) => updateLine(line.key, { maxQuantity: e.target.value })} placeholder="∞" className={`h-9 px-2 ${lineErrors[line.key]?.maxQuantity ? "border-rose-300 dark:border-rose-700" : ""}`} aria-label={isRTL ? "أقصى كمية" : "Maximum quantity"} aria-invalid={!!lineErrors[line.key]?.maxQuantity} />
                <Button type="button" variant="ghost" size="icon-sm" disabled={lines.length === 1} onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))} aria-label={isRTL ? "حذف السطر" : "Remove line"}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                {lineErrors[line.key] && (
                  <p className="col-span-5 text-xs font-medium text-rose-600 dark:text-rose-400">
                    {Object.values(lineErrors[line.key]).join(" · ")}
                  </p>
                )}
              </div>
            ))}
            <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => setLines((prev) => [...prev, newLine()])}><Plus className="h-4 w-4" />{isRTL ? "إضافة سعر" : "Add price"}</Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{isRTL ? "ملاحظات" : "Notes"}</Label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} aria-label={isRTL ? "ملاحظات" : "Notes"} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? "عدد الأسعار" : "Price lines"}</span>
              <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{totalLines}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{isRTL ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={submit} loading={createMutation.isPending || updateMutation.isPending}>{priceList ? (isRTL ? "حفظ" : "Save") : (isRTL ? "إنشاء" : "Create")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PriceListModal;
