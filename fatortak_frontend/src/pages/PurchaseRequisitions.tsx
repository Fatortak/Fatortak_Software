import React, { useState } from "react";
import {
  Check,
  ClipboardList,
  Eye,
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
  useDeletePurchaseRequisition,
  usePurchaseRequisitions,
  useUpdatePurchaseRequisitionStatus,
} from "@/hooks/usePurchaseRequisitions";
import PurchaseRequisitionModal from "@/components/modals/PurchaseRequisitionModal";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { PurchaseRequisitionDto } from "@/types/api";

const statusTone = (status: string) => {
  switch (status) {
    case "Submitted":
      return "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
    case "Approved":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Rejected":
      return "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300";
    case "Cancelled":
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }
};

const PurchaseRequisitions: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [showForm, setShowForm] = useState(false);
  const [details, setDetails] = useState<PurchaseRequisitionDto | null>(null);

  const { data: response, isLoading, refetch } = usePurchaseRequisitions(pagination, {
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const statusMutation = useUpdatePurchaseRequisitionStatus();
  const deleteMutation = useDeletePurchaseRequisition();

  const requisitions = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;

  const changeStatus = async (item: PurchaseRequisitionDto, next: string) => {
    try {
      await statusMutation.mutateAsync({ id: item.id, status: next });
      toast.success(isRTL ? "تم تحديث الطلب" : "Requisition updated");
      setDetails(null);
    } catch (error: any) {
      toast.error(error?.message || "Could not update requisition");
    }
  };

  const remove = async (item: PurchaseRequisitionDto) => {
    try {
      await deleteMutation.mutateAsync(item.id);
      toast.success(isRTL ? "تم حذف الطلب" : "Requisition deleted");
    } catch (error: any) {
      toast.error(error?.message || "Could not delete requisition");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المشتريات" : "Purchasing"}
        title={isRTL ? "طلبات الشراء" : "Purchase requisitions"}
        description={
          isRTL
            ? "اطلب احتياجات الأقسام، اعتمدها، ثم حوّلها إلى طلبات عروض أو أوامر شراء."
            : "Raise internal purchase requests, approve them, then move them into RFQs or purchase orders."
        }
        actions={
          roleAccess.canCreate() ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              {isRTL ? "طلب شراء جديد" : "New requisition"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "إجمالي الطلبات" : "Total requests"} value={stats.total || totalCount} subtitle={isRTL ? "كل الطلبات" : "All requests"} icon={ClipboardList} tone="brand" />
        <StatCard title={isRTL ? "مرسلة" : "Submitted"} value={stats.submitted || 0} subtitle={isRTL ? "بانتظار الاعتماد" : "Awaiting approval"} icon={Send} tone="info" />
        <StatCard title={isRTL ? "معتمدة" : "Approved"} value={stats.approved || 0} subtitle={isRTL ? "جاهزة للمشتريات" : "Ready for purchasing"} icon={Check} tone="success" />
        <StatCard title={isRTL ? "القيمة التقديرية" : "Estimated value"} value={formatCurrency(stats.totalValue || 0)} subtitle={isRTL ? "لكل الطلبات" : "Across requests"} icon={ClipboardList} tone="neutral" />
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageNumber: 1 })); }} placeholder={isRTL ? "ابحث برقم الطلب أو العنوان..." : "Search request or title..."} className="ps-9" />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
            <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="Draft">{isRTL ? "مسودة" : "Draft"}</SelectItem>
              <SelectItem value="Submitted">{isRTL ? "مرسل" : "Submitted"}</SelectItem>
              <SelectItem value="Approved">{isRTL ? "معتمد" : "Approved"}</SelectItem>
              <SelectItem value="Rejected">{isRTL ? "مرفوض" : "Rejected"}</SelectItem>
              <SelectItem value="Cancelled">{isRTL ? "ملغي" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{isRTL ? "جارٍ التحميل..." : "Loading requisitions..."}</CardContent>
        ) : requisitions.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"><ClipboardList className="h-7 w-7" /></div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isRTL ? "لا توجد طلبات شراء" : "No purchase requisitions yet"}</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{isRTL ? "أنشئ طلباً داخلياً وابدأ مسار الاعتماد." : "Raise an internal request to start the approval flow."}</p>
            {roleAccess.canCreate() && <Button className="mt-5" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />{isRTL ? "طلب شراء جديد" : "New requisition"}</Button>}
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>{isRTL ? "الطلب" : "Request"}</TableHead><TableHead>{isRTL ? "العنوان" : "Title"}</TableHead><TableHead>{isRTL ? "مقدم الطلب" : "Requester"}</TableHead><TableHead>{isRTL ? "مطلوب بحلول" : "Needed by"}</TableHead><TableHead>{isRTL ? "القيمة" : "Value"}</TableHead><TableHead>{isRTL ? "الحالة" : "Status"}</TableHead><TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead></TableRow></TableHeader>
              <TableBody>
                {requisitions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white"><button className="whitespace-nowrap hover:text-brand-600" onClick={() => setDetails(item)}>{item.requestNumber}</button></TableCell>
                    <TableCell className="max-w-[220px] truncate text-slate-600 dark:text-slate-300">{item.title}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{item.requesterName || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(item.neededBy).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(item.total)}</TableCell>
                    <TableCell><Badge className={statusTone(item.status)}>{item.status}</Badge></TableCell>
                    <TableCell><div className="flex items-center justify-end gap-0.5">
                      <Button variant="ghost" size="icon-sm" onClick={() => setDetails(item)} aria-label="View requisition"><Eye className="h-4 w-4" /></Button>
                      {roleAccess.canEdit() && item.status === "Draft" && <Button variant="ghost" size="icon-sm" onClick={() => changeStatus(item, "Submitted")} aria-label="Submit requisition"><Send className="h-4 w-4 text-sky-600" /></Button>}
                      {roleAccess.canEdit() && item.status === "Submitted" && <><Button variant="ghost" size="icon-sm" onClick={() => changeStatus(item, "Approved")} aria-label="Approve requisition"><Check className="h-4 w-4 text-emerald-600" /></Button><Button variant="ghost" size="icon-sm" onClick={() => changeStatus(item, "Rejected")} aria-label="Reject requisition"><X className="h-4 w-4 text-rose-500" /></Button></>}
                      {roleAccess.canDelete() && item.status === "Draft" && <Button variant="ghost" size="icon-sm" onClick={() => remove(item)} aria-label="Delete requisition"><Trash2 className="h-4 w-4 text-rose-500" /></Button>}
                    </div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "طلب" : `request${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <PurchaseRequisitionModal isOpen={showForm} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch(); }} />

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{details?.requestNumber} — {details?.title}</DialogTitle></DialogHeader>
          {details && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-400">{isRTL ? "مقدم الطلب" : "Requester"}</p><p className="font-medium">{details.requesterName || "-"}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "مطلوب بحلول" : "Needed by"}</p><p className="font-medium">{new Date(details.neededBy).toLocaleDateString()}</p></div>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"><tr><th className="px-3 py-2 text-start">{isRTL ? "الوصف" : "Description"}</th><th className="px-3 py-2 text-end">{isRTL ? "الكمية" : "Qty"}</th><th className="px-3 py-2 text-end">{isRTL ? "السعر" : "Price"}</th><th className="px-3 py-2 text-end">{isRTL ? "الإجمالي" : "Total"}</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.items.map((line) => (<tr key={line.id}><td className="px-3 py-2">{line.description}</td><td className="px-3 py-2 text-end tabular-nums">{line.quantity}</td><td className="px-3 py-2 text-end tabular-nums">{formatCurrency(line.estimatedUnitPrice)}</td><td className="px-3 py-2 text-end font-medium tabular-nums">{formatCurrency(line.lineTotal)}</td></tr>))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">{isRTL ? "القيمة التقديرية" : "Estimated value"}</span><span className="font-semibold">{formatCurrency(details.total)} EGP</span></div>
              {details.notes && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{details.notes}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetails(null)}>{isRTL ? "إغلاق" : "Close"}</Button>
            {details?.status === "Draft" && <Button onClick={() => changeStatus(details, "Submitted")}>{isRTL ? "إرسال للاعتماد" : "Submit"}</Button>}
            {details?.status === "Submitted" && <><Button variant="outline" onClick={() => changeStatus(details, "Rejected")}>{isRTL ? "رفض" : "Reject"}</Button><Button onClick={() => changeStatus(details, "Approved")}>{isRTL ? "اعتماد" : "Approve"}</Button></>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseRequisitions;
