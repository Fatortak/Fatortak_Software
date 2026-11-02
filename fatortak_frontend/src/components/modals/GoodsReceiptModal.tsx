import React, { useEffect, useMemo, useState } from "react";
import { PackageCheck } from "lucide-react";
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
import {
  useCreateGoodsReceipt,
  usePostGoodsReceipt,
} from "@/hooks/useGoodsReceipts";
import { usePurchaseOrder, usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { formatCurrency } from "@/Helpers/formatCurrency";
import FormErrorSummary, { FormErrorItem } from "@/components/forms/FormErrorSummary";
import type { PurchaseOrderDto } from "@/types/api";

interface Props {
  isOpen: boolean;
  order?: PurchaseOrderDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface Quantity {
  received: number;
  rejected: number;
}

const GoodsReceiptModal: React.FC<Props> = ({
  isOpen,
  order,
  onClose,
  onSuccess,
}) => {
  const { isRTL } = useLanguage();
  const createMutation = useCreateGoodsReceipt();
  const postMutation = usePostGoodsReceipt();
  const { data: orderListResponse } = usePurchaseOrders(
    { pageNumber: 1, pageSize: 100 },
    undefined
  );
  const selectableOrders = (orderListResponse?.success
    ? orderListResponse.data?.data || []
    : []
  ).filter((o) => o.status === "Ordered" || o.status === "PartiallyReceived");

  const [orderId, setOrderId] = useState("");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [postNow, setPostNow] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, Quantity>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: detailResponse } = usePurchaseOrder(orderId || undefined);
  const selectedOrder: PurchaseOrderDto | undefined = order
    ? order
    : detailResponse?.success
      ? detailResponse.data
      : undefined;

  useEffect(() => {
    if (!isOpen) return;
    setOrderId(order?.id || "");
    setReceivedDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setPostNow(true);
    setQuantities({});
  }, [isOpen, order]);

  useEffect(() => {
    if (!isOpen || !selectedOrder) return;
    setQuantities(
      Object.fromEntries(
        selectedOrder.items.map((item) => [
          item.id,
          { received: item.remainingQuantity, rejected: 0 },
        ])
      )
    );
  }, [isOpen, selectedOrder]);

  const receivedValue = useMemo(
    () =>
      selectedOrder
        ? selectedOrder.items.reduce(
            (sum, item) =>
              sum + (quantities[item.id]?.received || 0) * item.unitPrice,
            0
          )
        : 0,
    [selectedOrder, quantities]
  );

  const updateQuantity = (id: string, patch: Partial<Quantity>) =>
    setQuantities((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { received: 0, rejected: 0 }), ...patch },
    }));

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!selectedOrder) {
      nextErrors.orderId = isRTL ? "اختر أمر الشراء" : "Choose a purchase order";
    }
    if (!receivedDate) {
      nextErrors.receivedDate = isRTL ? "تاريخ الاستلام مطلوب" : "Received date is required";
    }

    const lines = selectedOrder
      ? selectedOrder.items
          .map((item) => ({
            purchaseOrderItemId: item.id,
            receivedQuantity: quantities[item.id]?.received || 0,
            rejectedQuantity: quantities[item.id]?.rejected || 0,
          }))
          .filter((line) => line.receivedQuantity > 0 || line.rejectedQuantity > 0)
      : [];

    if (lines.length === 0) {
      nextErrors.items = isRTL
        ? "أدخل كمية مستلمة أو مرفوضة واحدة على الأقل"
        : "Enter at least one received or rejected quantity";
    }
    if (lines.some((line) => line.receivedQuantity < 0 || line.rejectedQuantity < 0)) {
      nextErrors.items = isRTL
        ? "الكميات يجب ألا تكون سالبة"
        : "Quantities cannot be negative";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !selectedOrder) {
      toast.error(isRTL ? "راجع الحقول المطلوبة" : "Review the highlighted fields");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        purchaseOrderId: selectedOrder.id,
        receivedDate,
        notes,
        items: lines,
      });
      const created = result.data;
      if (postNow) {
        await postMutation.mutateAsync(created.id);
        toast.success(
          isRTL
            ? `تم ترحيل ${created.grnNumber} وتحديث المخزون`
            : `${created.grnNumber} posted and stock updated`
        );
      } else {
        toast.success(isRTL ? "تم حفظ إذن الاستلام كمسودة" : "Goods receipt saved as draft");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Could not save goods receipt");
    }
  };

  const errorSummary: FormErrorItem[] = Object.entries(errors).map(
    ([field, message]) => ({ field, message })
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-brand-600" />
            {isRTL ? "استلام بضاعة" : "Receive goods"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <FormErrorSummary errors={errorSummary} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{isRTL ? "أمر الشراء" : "Purchase order"} *</Label>
              {order ? (
                <p className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-700">
                  {order.poNumber} — {order.supplierName}
                </p>
              ) : (
                <Select value={orderId} onValueChange={(value) => { setOrderId(value); setErrors((prev) => ({ ...prev, orderId: "" })); }}>
                  <SelectTrigger aria-label={isRTL ? "أمر الشراء" : "Purchase order"} aria-invalid={!!errors.orderId} className={errors.orderId ? "border-rose-300 dark:border-rose-700" : ""}>
                    <SelectValue placeholder={isRTL ? "اختر أمر الشراء" : "Select order"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableOrders.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.poNumber} — {item.supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "تاريخ الاستلام" : "Received date"}</Label>
              <Input
                type="date"
                value={receivedDate}
                onChange={(e) => { setReceivedDate(e.target.value); setErrors((prev) => ({ ...prev, receivedDate: "" })); }}
                aria-label={isRTL ? "تاريخ الاستلام" : "Received date"}
                aria-invalid={!!errors.receivedDate}
                className={errors.receivedDate ? "border-rose-300 dark:border-rose-700" : ""}
              />
            </div>
          </div>

          {!selectedOrder ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {isRTL
                ? "اختر أمر شراء لعرض الكميات المتبقية."
                : "Select a purchase order to see remaining quantities."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-start">{isRTL ? "البند" : "Item"}</th>
                    <th className="px-3 py-2 text-end">{isRTL ? "الطلب" : "Ordered"}</th>
                    <th className="px-3 py-2 text-end">{isRTL ? "متبقي" : "Remaining"}</th>
                    <th className="px-3 py-2 text-end">{isRTL ? "مستلم" : "Received"}</th>
                    <th className="px-3 py-2 text-end">{isRTL ? "مرفوض" : "Rejected"}</th>
                    <th className="px-3 py-2 text-end">{isRTL ? "القيمة" : "Value"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">{item.description}</td>
                      <td className="px-3 py-2 text-end tabular-nums">{item.quantity}</td>
                      <td className="px-3 py-2 text-end tabular-nums">{item.remainingQuantity}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          max={item.remainingQuantity}
                          value={quantities[item.id]?.received ?? 0}
                          onChange={(e) =>
                            updateQuantity(item.id, {
                              received: Number(e.target.value) || 0,
                            })
                          }
                          className="ms-auto h-8 w-20 px-2 text-end"
                          aria-label={`${isRTL ? "مستلم" : "Received"} ${item.description}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          max={item.remainingQuantity}
                          value={quantities[item.id]?.rejected ?? 0}
                          onChange={(e) =>
                            updateQuantity(item.id, {
                              rejected: Number(e.target.value) || 0,
                            })
                          }
                          className="ms-auto h-8 w-20 px-2 text-end"
                          aria-label={`${isRTL ? "مرفوض" : "Rejected"} ${item.description}`}
                        />
                      </td>
                      <td className="px-3 py-2 text-end font-medium tabular-nums">
                        {formatCurrency(
                          (quantities[item.id]?.received || 0) * item.unitPrice
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-800/40">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={postNow}
                onChange={(e) => setPostNow(e.target.checked)}
              />
              {isRTL
                ? "ترحيل فوراً وتحديث المخزون"
                : "Post immediately and update stock"}
            </label>
            <div className="text-end">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRTL ? "قيمة الاستلام" : "Receipt value"}
              </p>
              <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(receivedValue)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={submit}
            loading={createMutation.isPending || postMutation.isPending}
            disabled={!selectedOrder}
          >
            {postNow
              ? isRTL ? "حفظ وترحيل" : "Save and post"
              : isRTL ? "حفظ كمسودة" : "Save draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoodsReceiptModal;
