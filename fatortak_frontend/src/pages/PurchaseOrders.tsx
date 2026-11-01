import React, { useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileCheck2,
  PackageCheck,
  PackagePlus,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import {
  useDeletePurchaseOrder,
  usePurchaseOrders,
  useSupplierBillMatching,
  useUpdatePurchaseOrderStatus,
} from "@/hooks/usePurchaseOrders";
import PurchaseOrderModal from "@/components/modals/PurchaseOrderModal";
import GoodsReceiptModal from "@/components/modals/GoodsReceiptModal";
import SupplierBillModal from "@/components/modals/SupplierBillModal";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { PurchaseOrderDto } from "@/types/api";

const statusTone = (status: string) => {
  switch (status) {
    case "Ordered":
      return "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
    case "PartiallyReceived":
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "Received":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Closed":
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "Cancelled":
      return "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
};

const PurchaseOrders: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [showForm, setShowForm] = useState(false);
  const [details, setDetails] = useState<PurchaseOrderDto | null>(null);
  const [receiving, setReceiving] = useState<PurchaseOrderDto | null>(null);
  const [billing, setBilling] = useState<PurchaseOrderDto | null>(null);

  const { data: response, isLoading, refetch } = usePurchaseOrders(pagination, {
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const { data: billResponse } = useSupplierBillMatching(details?.id);
  const billingSummary = billResponse?.success ? billResponse.data : undefined;
  const statusMutation = useUpdatePurchaseOrderStatus();
  const deleteMutation = useDeletePurchaseOrder();

  const orders = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;

  const refreshDetails = async () => {
    const result = await refetch();
    if (details && result.data?.success) {
      const fresh = result.data.data?.data?.find((o) => o.id === details.id);
      setDetails(fresh || null);
    }
  };

  const changeStatus = async (order: PurchaseOrderDto, next: string) => {
    try {
      await statusMutation.mutateAsync({ id: order.id, status: next });
      toast.success(isRTL ? "تم تحديث أمر الشراء" : "Purchase order updated");
      await refreshDetails();
    } catch (error: any) {
      toast.error(error?.message || "Could not update purchase order");
    }
  };

  const remove = async (order: PurchaseOrderDto) => {
    try {
      await deleteMutation.mutateAsync(order.id);
      toast.success(isRTL ? "تم حذف أمر الشراء" : "Purchase order deleted");
      setDetails(null);
    } catch (error: any) {
      toast.error(error?.message || "Could not delete purchase order");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المشتريات" : "Purchasing"}
        title={isRTL ? "أوامر الشراء" : "Purchase orders"}
        description={
          isRTL
            ? "تابع أوامر الشراء من الإرسال للمورد حتى الاستلام الكامل وترحيل المخزون."
            : "Track purchase orders from supplier confirmation through full receipt and stock posting."
        }
        actions={
          roleAccess.canCreate() ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              {isRTL ? "أمر شراء جديد" : "New purchase order"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "أوامر الشراء" : "Purchase orders"} value={stats.total || totalCount} subtitle={isRTL ? "كل الأوامر" : "All orders"} icon={PackagePlus} tone="brand" />
        <StatCard title={isRTL ? "مرسلة للموردين" : "Ordered"} value={stats.ordered || 0} subtitle={isRTL ? "بانتظار الاستلام" : "Awaiting receipt"} icon={Send} tone="info" />
        <StatCard title={isRTL ? "استلام جزئي" : "Partially received"} value={stats.partiallyReceived || 0} subtitle={isRTL ? "قيد التوريد" : "In progress"} icon={PackageCheck} tone="warning" />
        <StatCard title={isRTL ? "قيمة الأوامر" : "Order value"} value={formatCurrency(stats.totalValue || 0)} subtitle={isRTL ? "إجمالي الالتزامات" : "Total commitment"} icon={CheckCircle2} tone="success" />
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageNumber: 1 }));
              }}
              placeholder={isRTL ? "ابحث برقم الأمر أو المورد..." : "Search PO or supplier..."}
              className="ps-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPagination((p) => ({ ...p, pageNumber: 1 }));
            }}
          >
            <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="Draft">{isRTL ? "مسودة" : "Draft"}</SelectItem>
              <SelectItem value="Ordered">{isRTL ? "مرسل" : "Ordered"}</SelectItem>
              <SelectItem value="PartiallyReceived">{isRTL ? "استلام جزئي" : "Partially received"}</SelectItem>
              <SelectItem value="Received">{isRTL ? "تم الاستلام" : "Received"}</SelectItem>
              <SelectItem value="Closed">{isRTL ? "مغلق" : "Closed"}</SelectItem>
              <SelectItem value="Cancelled">{isRTL ? "ملغي" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            {isRTL ? "جارٍ التحميل..." : "Loading purchase orders..."}
          </CardContent>
        ) : orders.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              <PackagePlus className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isRTL ? "لا توجد أوامر شراء" : "No purchase orders yet"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {isRTL
                ? "أنشئ أمر شراء مباشرة أو رشّح عرض مورد من طلب عرض الأسعار."
                : "Create a purchase order directly or award a supplier quote from an RFQ."}
            </p>
            {roleAccess.canCreate() && (
              <Button className="mt-5" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                {isRTL ? "أمر شراء جديد" : "New purchase order"}
              </Button>
            )}
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "الأمر" : "PO"}</TableHead>
                  <TableHead>{isRTL ? "المورد" : "Supplier"}</TableHead>
                  <TableHead>{isRTL ? "التسليم المتوقع" : "Expected"}</TableHead>
                  <TableHead>{isRTL ? "الاستلام" : "Received"}</TableHead>
                  <TableHead>{isRTL ? "الإجمالي" : "Total"}</TableHead>
                  <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const received = order.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
                  const ordered = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        <button className="whitespace-nowrap hover:text-brand-600" onClick={() => setDetails(order)}>
                          {order.poNumber}
                        </button>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-slate-600 dark:text-slate-300">{order.supplierName}</TableCell>
                      <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(order.expectedDate).toLocaleDateString()}</TableCell>
                      <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {received}/{ordered}
                        {order.goodsReceiptCount > 0 && <span className="ms-1 text-xs text-emerald-600 dark:text-emerald-400">({order.goodsReceiptCount} GRN)</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(order.total)}</TableCell>
                      <TableCell><Badge className={statusTone(order.status)}>{order.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon-sm" onClick={() => setDetails(order)} aria-label="View purchase order"><Eye className="h-4 w-4" /></Button>
                          {roleAccess.canEdit() && order.status === "Draft" && (
                            <Button variant="ghost" size="icon-sm" onClick={() => changeStatus(order, "Ordered")} aria-label="Send purchase order"><Send className="h-4 w-4 text-sky-600" /></Button>
                          )}
                          {roleAccess.canEdit() && ["Ordered", "PartiallyReceived"].includes(order.status) && (
                            <Button variant="ghost" size="icon-sm" onClick={() => setReceiving(order)} aria-label="Receive goods"><PackageCheck className="h-4 w-4 text-emerald-600" /></Button>
                          )}
                          {roleAccess.canDelete() && order.status === "Draft" && (
                            <Button variant="ghost" size="icon-sm" onClick={() => remove(order)} aria-label="Delete purchase order"><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "أمر" : `order${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <PurchaseOrderModal isOpen={showForm} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch(); }} />

      <GoodsReceiptModal
        isOpen={!!receiving}
        order={receiving}
        onClose={() => setReceiving(null)}
        onSuccess={() => { setReceiving(null); refetch(); }}
      />

      <SupplierBillModal
        isOpen={!!billing}
        order={billing}
        onClose={() => setBilling(null)}
        onSuccess={() => { setBilling(null); refreshDetails(); }}
      />

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{details?.poNumber} — {details?.supplierName}</DialogTitle></DialogHeader>
          {details && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-slate-400">{isRTL ? "الحالة" : "Status"}</p><Badge className={statusTone(details.status)}>{details.status}</Badge></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "التسليم المتوقع" : "Expected"}</p><p className="font-medium">{new Date(details.expectedDate).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "طلب العرض" : "RFQ"}</p><p className="font-medium">{details.rfqNumber || "-"}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "الإجمالي" : "Total"}</p><p className="font-semibold">{formatCurrency(details.total)}</p></div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr><th className="px-3 py-2 text-start">{isRTL ? "البند" : "Item"}</th><th className="px-3 py-2 text-end">{isRTL ? "الكمية" : "Qty"}</th><th className="px-3 py-2 text-end">{isRTL ? "السعر" : "Price"}</th><th className="px-3 py-2 text-end">{isRTL ? "مستلم" : "Received"}</th><th className="px-3 py-2 text-end">{isRTL ? "الإجمالي" : "Total"}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.items.map((line) => (
                      <tr key={line.id}>
                        <td className="px-3 py-2">{line.description}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{line.quantity}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{formatCurrency(line.unitPrice)}</td>
                        <td className="px-3 py-2 text-end tabular-nums">
                          {line.receivedQuantity}
                          {line.rejectedQuantity > 0 && <span className="text-rose-500"> / {line.rejectedQuantity} {isRTL ? "مرفوض" : "rej."}</span>}
                        </td>
                        <td className="px-3 py-2 text-end font-medium tabular-nums">{formatCurrency(line.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div><p className="text-xs text-slate-400">{isRTL ? "قبل الضريبة" : "Subtotal"}</p><p className="font-medium tabular-nums">{formatCurrency(details.subtotal)}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "الضريبة" : "VAT"}</p><p className="font-medium tabular-nums">{formatCurrency(details.vatAmount)}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "المستلم" : "Received value"}</p><p className="font-medium tabular-nums">{formatCurrency(details.receivedValue)}</p></div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {isRTL ? "فواتير المورد والمطابقة" : "Supplier bills and matching"}
                  </h4>
                  {roleAccess.canCreate() && details.items.some((i) => i.remainingToBill > 0) && (
                    <Button size="sm" variant="outline" onClick={() => setBilling(details)}>
                      <FileCheck2 className="h-4 w-4" />
                      {isRTL ? "تسجيل فاتورة مورد" : "Record supplier bill"}
                    </Button>
                  )}
                </div>
                {billingSummary && billingSummary.bills.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>{isRTL ? "قيمة المستلم" : "Received"}: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(billingSummary.receivedValue)}</strong></span>
                      <span>{isRTL ? "قيمة المفوتر" : "Billed"}: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(billingSummary.billedValue)}</strong></span>
                      {billingSummary.hasVariance && <span className="text-amber-600 dark:text-amber-400">{isRTL ? "يوجد فرق سعري" : "Price variance detected"}</span>}
                    </div>
                    {billingSummary.bills.map((bill) => (
                      <div key={bill.invoiceId} className="flex flex-col gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">
                            {bill.invoiceNumber}
                            {bill.supplierInvoiceNumber && <span className="ms-2 text-xs font-normal text-slate-500">{bill.supplierInvoiceNumber}</span>}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(bill.issueDate).toLocaleDateString()} · {bill.status}
                            {bill.hasVariance && <span className="ms-2 text-amber-600 dark:text-amber-400">{isRTL ? "فرق" : "variance"}</span>}
                          </p>
                        </div>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(bill.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {isRTL
                      ? "لا توجد فواتير مورد مرتبطة بعد. سجّل فاتورة من الكميات المستلمة."
                      : "No supplier bills linked yet. Record one from the received quantities."}
                  </p>
                )}
              </div>

              {details.notes && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{details.notes}</p>}
            </div>
          )}
          <DialogFooter className="flex-wrap">
            <Button variant="outline" onClick={() => setDetails(null)}>{isRTL ? "إغلاق" : "Close"}</Button>
            {roleAccess.canEdit() && details?.status === "Draft" && <Button onClick={() => changeStatus(details!, "Ordered")}><Send className="h-4 w-4" />{isRTL ? "إرسال للمورد" : "Send to supplier"}</Button>}
            {roleAccess.canEdit() && details && ["Ordered", "PartiallyReceived"].includes(details.status) && <Button onClick={() => { setReceiving(details); setDetails(null); }}><PackageCheck className="h-4 w-4" />{isRTL ? "استلام بضاعة" : "Receive goods"}</Button>}
            {roleAccess.canEdit() && details && ["Ordered", "PartiallyReceived", "Received"].includes(details.status) && <Button variant="outline" onClick={() => changeStatus(details!, "Closed")}>{isRTL ? "إغلاق الأمر" : "Close order"}</Button>}
            {roleAccess.canEdit() && details && !details.goodsReceiptCount && details.status === "Draft" && <Button variant="outline" onClick={() => changeStatus(details!, "Cancelled")}><X className="h-4 w-4" />{isRTL ? "إلغاء" : "Cancel"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
