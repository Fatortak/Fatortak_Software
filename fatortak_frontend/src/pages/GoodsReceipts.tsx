import React, { useState } from "react";
import {
  CheckCircle2,
  Eye,
  PackageCheck,
  Plus,
  Search,
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
  useDeleteGoodsReceipt,
  useGoodsReceipts,
  usePostGoodsReceipt,
  useUpdateGoodsReceiptStatus,
} from "@/hooks/useGoodsReceipts";
import GoodsReceiptModal from "@/components/modals/GoodsReceiptModal";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { GoodsReceiptDto } from "@/types/api";

const statusTone = (status: string) => {
  switch (status) {
    case "Posted":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Cancelled":
      return "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300";
    default:
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }
};

const GoodsReceipts: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [showForm, setShowForm] = useState(false);
  const [details, setDetails] = useState<GoodsReceiptDto | null>(null);

  const { data: response, isLoading, refetch } = useGoodsReceipts(pagination, {
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const postMutation = usePostGoodsReceipt();
  const deleteMutation = useDeleteGoodsReceipt();
  const statusMutation = useUpdateGoodsReceiptStatus();

  const receipts = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;

  const refreshDetails = async () => {
    const result = await refetch();
    if (details && result.data?.success) {
      const fresh = result.data.data?.data?.find((g) => g.id === details.id);
      setDetails(fresh || null);
    }
  };

  const post = async (receipt: GoodsReceiptDto) => {
    try {
      await postMutation.mutateAsync(receipt.id);
      toast.success(
        isRTL
          ? "تم ترحيل الاستلام وتحديث المخزون"
          : "Goods receipt posted and stock updated"
      );
      await refreshDetails();
    } catch (error: any) {
      toast.error(error?.message || "Could not post goods receipt");
    }
  };

  const remove = async (receipt: GoodsReceiptDto) => {
    try {
      await deleteMutation.mutateAsync(receipt.id);
      toast.success(isRTL ? "تم حذف إذن الاستلام" : "Goods receipt deleted");
      setDetails(null);
    } catch (error: any) {
      toast.error(error?.message || "Could not delete goods receipt");
    }
  };

  const cancel = async (receipt: GoodsReceiptDto) => {
    try {
      await statusMutation.mutateAsync({ id: receipt.id, status: "Cancelled" });
      toast.success(isRTL ? "تم إلغاء إذن الاستلام" : "Goods receipt cancelled");
      await refreshDetails();
    } catch (error: any) {
      toast.error(error?.message || "Could not cancel goods receipt");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المشتريات" : "Purchasing"}
        title={isRTL ? "إذون استلام البضاعة" : "Goods receipts"}
        description={
          isRTL
            ? "سجّل ما وصل من أوامر الشراء، ثم رحّل الإذن لتحديث المخزون والتكلفة."
            : "Record what arrived against purchase orders, then post to update stock and cost."
        }
        actions={
          roleAccess.canCreate() ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              {isRTL ? "إذن استلام جديد" : "New receipt"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "إذون الاستلام" : "Total receipts"} value={stats.total || totalCount} subtitle={isRTL ? "كل الأذون" : "All receipts"} icon={PackageCheck} tone="brand" />
        <StatCard title={isRTL ? "مسودات" : "Drafts"} value={stats.draft || 0} subtitle={isRTL ? "لم تُرحّل بعد" : "Not yet posted"} icon={PackageCheck} tone="warning" />
        <StatCard title={isRTL ? "مُرحّلة" : "Posted"} value={stats.posted || 0} subtitle={isRTL ? "حدّثت المخزون" : "Stock updated"} icon={CheckCircle2} tone="success" />
        <StatCard title={isRTL ? "قيمة المستلم" : "Received value"} value={formatCurrency(stats.receivedValue || 0)} subtitle={isRTL ? "قيمة البضاعة المستلمة" : "Value of goods received"} icon={PackageCheck} tone="neutral" />
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
              placeholder={isRTL ? "ابحث برقم الإذن أو أمر الشراء..." : "Search receipt or purchase order..."}
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
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="Draft">{isRTL ? "مسودة" : "Draft"}</SelectItem>
              <SelectItem value="Posted">{isRTL ? "مُرحّل" : "Posted"}</SelectItem>
              <SelectItem value="Cancelled">{isRTL ? "ملغي" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            {isRTL ? "جارٍ التحميل..." : "Loading goods receipts..."}
          </CardContent>
        ) : receipts.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              <PackageCheck className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isRTL ? "لا توجد إذون استلام" : "No goods receipts yet"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {isRTL
                ? "ابدأ باستلام أمر شراء مرسل وسجّل الكميات الواصلة."
                : "Start by receiving an ordered purchase order and recording the quantities."}
            </p>
            {roleAccess.canCreate() && (
              <Button className="mt-5" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                {isRTL ? "إذن استلام جديد" : "New receipt"}
              </Button>
            )}
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "الإذن" : "Receipt"}</TableHead>
                  <TableHead>{isRTL ? "أمر الشراء" : "Purchase order"}</TableHead>
                  <TableHead>{isRTL ? "المورد" : "Supplier"}</TableHead>
                  <TableHead>{isRTL ? "تاريخ الاستلام" : "Received"}</TableHead>
                  <TableHead>{isRTL ? "القيمة" : "Value"}</TableHead>
                  <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      <button className="whitespace-nowrap hover:text-brand-600" onClick={() => setDetails(receipt)}>
                        {receipt.grnNumber}
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-300">{receipt.poNumber}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-slate-600 dark:text-slate-300">{receipt.supplierName}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(receipt.receivedDate).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(receipt.receivedValue)}</TableCell>
                    <TableCell><Badge className={statusTone(receipt.status)}>{receipt.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon-sm" onClick={() => setDetails(receipt)} aria-label="View goods receipt"><Eye className="h-4 w-4" /></Button>
                        {roleAccess.canEdit() && receipt.status === "Draft" && <Button variant="ghost" size="icon-sm" onClick={() => post(receipt)} aria-label="Post goods receipt"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></Button>}
                        {roleAccess.canDelete() && receipt.status === "Draft" && <Button variant="ghost" size="icon-sm" onClick={() => remove(receipt)} aria-label="Delete goods receipt"><Trash2 className="h-4 w-4 text-rose-500" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "إذن" : `receipt${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <GoodsReceiptModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => { setShowForm(false); refetch(); }}
      />

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{details?.grnNumber} — {details?.poNumber}</DialogTitle></DialogHeader>
          {details && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-slate-400">{isRTL ? "الحالة" : "Status"}</p><Badge className={statusTone(details.status)}>{details.status}</Badge></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "المورد" : "Supplier"}</p><p className="font-medium">{details.supplierName}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "تاريخ الاستلام" : "Received date"}</p><p className="font-medium">{new Date(details.receivedDate).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "القيمة" : "Value"}</p><p className="font-semibold">{formatCurrency(details.receivedValue)}</p></div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr><th className="px-3 py-2 text-start">{isRTL ? "البند" : "Item"}</th><th className="px-3 py-2 text-end">{isRTL ? "الطلب" : "Ordered"}</th><th className="px-3 py-2 text-end">{isRTL ? "مستلم" : "Received"}</th><th className="px-3 py-2 text-end">{isRTL ? "مرفوض" : "Rejected"}</th><th className="px-3 py-2 text-end">{isRTL ? "القيمة" : "Value"}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.items.map((line) => (
                      <tr key={line.id}>
                        <td className="px-3 py-2">{line.description}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{line.orderedQuantity}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{line.receivedQuantity}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{line.rejectedQuantity}</td>
                        <td className="px-3 py-2 text-end font-medium tabular-nums">{formatCurrency(line.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {details.notes && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{details.notes}</p>}
              {details.receivedByName && <p className="text-xs text-slate-400">{isRTL ? "استلمه" : "Received by"} {details.receivedByName}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetails(null)}>{isRTL ? "إغلاق" : "Close"}</Button>
            {roleAccess.canEdit() && details?.status === "Draft" && <Button onClick={() => post(details!)} loading={postMutation.isPending}><CheckCircle2 className="h-4 w-4" />{isRTL ? "ترحيل وتحديث المخزون" : "Post and update stock"}</Button>}
            {roleAccess.canEdit() && details?.status === "Draft" && <Button variant="outline" onClick={() => cancel(details!)}><X className="h-4 w-4" />{isRTL ? "إلغاء" : "Cancel"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoodsReceipts;
