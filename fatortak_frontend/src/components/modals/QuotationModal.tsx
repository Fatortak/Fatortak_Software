import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Calculator, FileText } from "lucide-react";
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
import { useCustomers } from "@/hooks/useCustomers";
import { useItems } from "@/hooks/useItems";
import { useCurrentCompany } from "@/hooks/useCompanies";
import {
  useCreateQuotation,
  useUpdateQuotation,
} from "@/hooks/useQuotations";
import { formatCurrency } from "@/Helpers/formatCurrency";
import { pricingService } from "@/services/pricingService";
import FormField from "@/components/forms/FormField";
import FormErrorSummary, { FormErrorItem } from "@/components/forms/FormErrorSummary";
import {
  isDateRangeValid,
  isNonEmpty,
  isNonNegativeNumber,
  isPercentage,
  isPositiveNumber,
} from "@/lib/validation";
import type { QuotationDto } from "@/types/api";

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  quotation?: QuotationDto | null;
}

interface Line {
  key: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountPercent: number;
}

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const newLine = (): Line => ({
  key: Math.random().toString(36).slice(2),
  itemId: undefined,
  description: "",
  quantity: 1,
  unitPrice: 0,
  vatRate: 0.14,
  discountPercent: 0,
});

const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  quotation,
}) => {
  const { isRTL } = useLanguage();
  const { data: customersResponse } = useCustomers({
    pageNumber: 1,
    pageSize: 200,
  });
  const { data: itemsResponse } = useItems({ pageNumber: 1, pageSize: 200 });
  const { data: companyResponse } = useCurrentCompany();
  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation();

  const customers = customersResponse?.success
    ? customersResponse.data?.data || []
    : [];
  const items = itemsResponse?.success ? itemsResponse.data?.data || [] : [];
  const currency = companyResponse?.data?.currency || "EGP";

  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(today());
  const [validUntil, setValidUntil] = useState(inDays(30));
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lineErrors, setLineErrors] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (quotation) {
      setCustomerId(quotation.customerId);
      setIssueDate(quotation.issueDate.slice(0, 10));
      setValidUntil(quotation.validUntil.slice(0, 10));
      setNotes(quotation.notes || "");
      setTerms(quotation.terms || "");
      setLines(
        quotation.items.map((item) => ({
          key: Math.random().toString(36).slice(2),
          itemId: item.itemId,
          description: item.description || item.itemName || "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate ?? 0.14,
          discountPercent: (item.discount || 0) * 100,
        }))
      );
    } else {
      setCustomerId("");
      setIssueDate(today());
      setValidUntil(inDays(30));
      setNotes("");
      setTerms("");
      setLines([newLine()]);
    }
  }, [isOpen, quotation]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let vat = 0;
    lines.forEach((line) => {
      const base = line.quantity * line.unitPrice;
      const lineDiscount = base * (line.discountPercent / 100);
      subtotal += base;
      discount += lineDiscount;
      vat += (base - lineDiscount) * line.vatRate;
    });
    return { subtotal, discount, vat, total: subtotal - discount + vat };
  }, [lines]);

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

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );

  const chooseItem = async (key: string, itemId: string) => {
    const item = items.find((i: any) => i.id === itemId);
    const currentLine = lines.find((line) => line.key === key);
    let unitPrice = item?.unitPrice ?? 0;
    try {
      const result = await pricingService.resolve(
        customerId || "00000000-0000-0000-0000-000000000000",
        itemId,
        currentLine?.quantity || 1
      );
      if (result.success) unitPrice = result.data.unitPrice;
    } catch {
      // Fall back to the item price when pricing cannot be resolved.
    }
    updateLine(key, {
      itemId,
      description: item?.name || "",
      unitPrice,
      vatRate: item?.vatRate ?? 0.14,
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const nextLineErrors: Record<string, Record<string, string>> = {};

    if (!customerId) {
      nextErrors.customerId = isRTL ? "اختر العميل" : "Choose a customer";
    }
    if (!issueDate) {
      nextErrors.issueDate = isRTL ? "تاريخ العرض مطلوب" : "Issue date is required";
    }
    if (!validUntil) {
      nextErrors.validUntil = isRTL ? "تاريخ الصلاحية مطلوب" : "Valid-until date is required";
    } else if (issueDate && !isDateRangeValid(issueDate, validUntil)) {
      nextErrors.validUntil = isRTL
        ? "تاريخ الصلاحية يجب أن يكون بعد تاريخ العرض"
        : "Valid-until must be on or after the issue date";
    }

    let validLineCount = 0;
    lines.forEach((line) => {
      const lineIssues: Record<string, string> = {};
      if (!isNonEmpty(line.description)) {
        lineIssues.description = isRTL ? "الوصف مطلوب" : "Description is required";
      }
      if (!isPositiveNumber(line.quantity)) {
        lineIssues.quantity = isRTL ? "أكبر من صفر" : "Must be greater than zero";
      }
      if (!isNonNegativeNumber(line.unitPrice)) {
        lineIssues.unitPrice = isRTL ? "سعر غير صالح" : "Invalid price";
      }
      if (!isPercentage(line.discountPercent)) {
        lineIssues.discountPercent = isRTL ? "0 إلى 100" : "0 to 100";
      }
      if (!isPercentage(line.vatRate * 100)) {
        lineIssues.vatRate = isRTL ? "0 إلى 100" : "0 to 100";
      }
      if (Object.keys(lineIssues).length === 0) validLineCount++;
      else nextLineErrors[line.key] = lineIssues;
    });

    if (validLineCount === 0) {
      nextErrors.lines = isRTL
        ? "أضف بنداً صالحاً واحداً على الأقل"
        : "Add at least one valid line item";
    }

    setErrors(nextErrors);
    setLineErrors(nextLineErrors);

    const summary: FormErrorItem[] = [
      ...Object.entries(nextErrors).map(([field, message]) => ({ field, message })),
      ...Object.entries(nextLineErrors).flatMap(([key, issues]) =>
        Object.entries(issues).map(([field, message]) => ({
          field: `${key}-${field}`,
          message,
        }))
      ),
    ];

    return {
      valid: summary.length === 0,
      summary,
      validLines: lines.filter((line) => !nextLineErrors[line.key]),
    };
  };

  const handleSubmit = async () => {
    const validation = validate();
    if (!validation.valid) {
      toast.error(
        isRTL ? "راجع الحقول المطلوبة" : "Review the highlighted fields"
      );
      return;
    }

    const payload = {
      customerId,
      issueDate,
      validUntil,
      status: quotation?.status || "Draft",
      notes,
      terms,
      items: validation.validLines.map((line) => ({
        itemId: line.itemId,
        description: line.description.trim(),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        vatRate: line.vatRate,
        discount: line.discountPercent / 100,
      })),
    };

    try {
      if (quotation) {
        await updateMutation.mutateAsync({ id: quotation.id, data: payload });
        toast.success(isRTL ? "تم تحديث العرض" : "Quotation updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(isRTL ? "تم إنشاء العرض" : "Quotation created");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || (isRTL ? "تعذر الحفظ" : "Could not save quotation"));
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[94vh] overflow-y-auto sm:max-w-4xl"
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            void handleSubmit();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-600" />
            {quotation
              ? isRTL ? "تعديل عرض السعر" : "Edit quotation"
              : isRTL ? "عرض سعر جديد" : "New quotation"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <FormErrorSummary errors={errorSummary} />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={isRTL ? "العميل" : "Customer"}
              required
              error={errors.customerId}
            >
              <Select
                value={customerId}
                onValueChange={(value) => {
                  setCustomerId(value);
                  if (errors.customerId)
                    setErrors((prev) => ({ ...prev, customerId: "" }));
                }}
              >
                <SelectTrigger
                  aria-label={isRTL ? "العميل" : "Customer"}
                  aria-invalid={!!errors.customerId}
                  className={errors.customerId ? "border-rose-300 dark:border-rose-700" : ""}
                >
                  <SelectValue placeholder={isRTL ? "اختر العميل" : "Select customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label={isRTL ? "تاريخ العرض" : "Issue date"}
                required
                error={errors.issueDate}
              >
                <Input
                  type="date"
                  aria-label={isRTL ? "تاريخ العرض" : "Issue date"}
                  aria-invalid={!!errors.issueDate}
                  className={errors.issueDate ? "border-rose-300 dark:border-rose-700" : ""}
                  value={issueDate}
                  onChange={(e) => {
                    setIssueDate(e.target.value);
                    if (errors.issueDate)
                      setErrors((prev) => ({ ...prev, issueDate: "" }));
                  }}
                />
              </FormField>
              <FormField
                label={isRTL ? "صالح حتى" : "Valid until"}
                required
                error={errors.validUntil}
              >
                <Input
                  type="date"
                  aria-label={isRTL ? "صالح حتى" : "Valid until"}
                  aria-invalid={!!errors.validUntil}
                  className={errors.validUntil ? "border-rose-300 dark:border-rose-700" : ""}
                  value={validUntil}
                  onChange={(e) => {
                    setValidUntil(e.target.value);
                    if (errors.validUntil)
                      setErrors((prev) => ({ ...prev, validUntil: "" }));
                  }}
                />
              </FormField>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid min-w-[720px] grid-cols-[minmax(0,2.2fr)_70px_100px_80px_90px_36px] gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <span>{isRTL ? "البند" : "Item"}</span>
              <span>{isRTL ? "الكمية" : "Qty"}</span>
              <span>{isRTL ? "السعر" : "Price"}</span>
              <span>{isRTL ? "خصم %" : "Disc %"}</span>
              <span>{isRTL ? "ضريبة %" : "VAT %"}</span>
              <span />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {lines.map((line) => (
                <div key={line.key} className="grid min-w-[720px] grid-cols-[minmax(0,2.2fr)_70px_100px_80px_90px_36px] items-center gap-2 px-3 py-2">
                  <div className="space-y-1">
                    <Select value={line.itemId} onValueChange={(value) => chooseItem(line.key, value)}>
                      <SelectTrigger className="h-9" aria-label={isRTL ? "البند" : "Item"}>
                        <SelectValue placeholder={isRTL ? "بند حر" : "Select or type an item"} />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(line.key, { description: e.target.value })}
                      aria-label={isRTL ? "وصف البند" : "Line description"}
                      aria-invalid={!!lineErrors[line.key]?.description}
                      placeholder={isRTL ? "وصف البند" : "Line description"}
                      className={`h-8 px-2 text-xs ${
                        lineErrors[line.key]?.description
                          ? "border-rose-300 dark:border-rose-700"
                          : ""
                      }`}
                    />
                  </div>
                  <Input
                    type="number"
                    min={1}
                    className={`h-9 px-2 ${
                      lineErrors[line.key]?.quantity
                        ? "border-rose-300 dark:border-rose-700"
                        : ""
                    }`}
                    aria-label={isRTL ? "الكمية" : "Quantity"}
                    aria-invalid={!!lineErrors[line.key]?.quantity}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 0 })}
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className={`h-9 px-2 ${
                      lineErrors[line.key]?.unitPrice
                        ? "border-rose-300 dark:border-rose-700"
                        : ""
                    }`}
                    aria-label={isRTL ? "سعر الوحدة" : "Unit price"}
                    aria-invalid={!!lineErrors[line.key]?.unitPrice}
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) || 0 })}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className={`h-9 px-2 ${
                      lineErrors[line.key]?.discountPercent
                        ? "border-rose-300 dark:border-rose-700"
                        : ""
                    }`}
                    aria-label={isRTL ? "نسبة الخصم" : "Discount percent"}
                    aria-invalid={!!lineErrors[line.key]?.discountPercent}
                    value={line.discountPercent}
                    onChange={(e) => updateLine(line.key, { discountPercent: Number(e.target.value) || 0 })}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    className={`h-9 px-2 ${
                      lineErrors[line.key]?.vatRate
                        ? "border-rose-300 dark:border-rose-700"
                        : ""
                    }`}
                    aria-label={isRTL ? "نسبة الضريبة" : "VAT percent"}
                    aria-invalid={!!lineErrors[line.key]?.vatRate}
                    value={Math.round(line.vatRate * 10000) / 100}
                    onChange={(e) => updateLine(line.key, { vatRate: (Number(e.target.value) || 0) / 100 })}
                  />
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
                  {lineErrors[line.key] && (
                    <p className="col-span-6 text-xs font-medium text-rose-600 dark:text-rose-400">
                      {Object.values(lineErrors[line.key]).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
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
              <Label>{isRTL ? "الشروط" : "Terms"}</Label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
                aria-label={isRTL ? "الشروط" : "Terms"}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Calculator className="h-4 w-4 text-brand-600" />
                {isRTL ? "الإجمالي" : "Summary"}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>{isRTL ? "الإجمالي الفرعي" : "Subtotal"}</span>
                  <span className="tabular-nums">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>{isRTL ? "الخصم" : "Discount"}</span>
                  <span className="tabular-nums">- {formatCurrency(totals.discount)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>{isRTL ? "الضريبة" : "VAT"}</span>
                  <span className="tabular-nums">{formatCurrency(totals.vat)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                  <span>{isRTL ? "الإجمالي" : "Total"}</span>
                  <span className="tabular-nums">{formatCurrency(totals.total)} {currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap items-center gap-2">
          <p className="me-auto hidden text-xs text-slate-400 sm:block">
            {isRTL ? "Ctrl/Cmd + Enter للحفظ" : "Ctrl/Cmd + Enter to save"}
          </p>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {quotation
              ? isRTL ? "حفظ التعديلات" : "Save changes"
              : isRTL ? "إنشاء العرض" : "Create quotation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationModal;
