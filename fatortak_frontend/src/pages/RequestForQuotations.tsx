import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  ClipboardList,
  Eye,
  MessageSquareQuote,
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
  useAwardRfq,
  useDeleteRfq,
  useRfqs,
  useUpdateRfqStatus,
} from "@/hooks/useRfqs";
import RfqModal from "@/components/modals/RfqModal";
import RfqQuoteModal from "@/components/modals/RfqQuoteModal";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { RfqDto, RfqSupplierDto } from "@/types/api";

const statusTone = (status: string) => {
  switch (status) {
    case "Sent":
      return "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
    case "ResponsesReceived":
      return "border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300";
    case "Awarded":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Cancelled":
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }
};

const RequestForQuotations: React.FC = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const roleAccess = useRoleAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [showForm, setShowForm] = useState(false);
  const [details, setDetails] = useState<RfqDto | null>(null);
  const [quoteTarget, setQuoteTarget] = useState<{
    rfq: RfqDto;
    supplier: RfqSupplierDto;
  } | null>(null);

  const { data: response, isLoading, refetch } = useRfqs(pagination, {
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const statusMutation = useUpdateRfqStatus();
  const deleteMutation = useDeleteRfq();
  const awardMutation = useAwardRfq();

  const rfqs = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;

  const refreshDetails = async () => {
    const result = await refetch();
    if (details && result.data?.success) {
      const fresh = result.data.data?.data?.find((r) => r.id === details.id);
      setDetails(fresh || null);
    }
  };

  const changeStatus = async (rfq: RfqDto, next: string) => {
    try {
      await statusMutation.mutateAsync({ id: rfq.id, status: next });
      toast.success(isRTL ? "تم تحديث طلب العرض" : "RFQ updated");
      await refreshDetails();
    } catch (error: any) {
      toast.error(error?.message || "Could not update RFQ");
    }
  };

  const remove = async (rfq: RfqDto) => {
    try {
      await deleteMutation.mutateAsync(rfq.id);
      toast.success(isRTL ? "تم حذف طلب العرض" : "RFQ deleted");
      setDetails(null);
    } catch (error: any) {
      toast.error(error?.message || "Could not delete RFQ");
    }
  };

  const award = async (rfq: RfqDto, supplier: RfqSupplierDto) => {
    try {
      const result = await awardMutation.mutateAsync({
        id: rfq.id,
        supplierId: supplier.supplierId,
        data: {
          expectedDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        },
      });
      toast.success(
        isRTL
          ? `تمت الترسية وإنشاء ${result.data?.purchaseOrderNumber}`
          : `Awarded — ${result.data?.purchaseOrderNumber} created`
      );
      await refreshDetails();
    } catch (error: any) {
      toast.error(error?.message || "Could not award RFQ");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المشتريات" : "Purchasing"}
        title={isRTL ? "طلبات عروض الأسعار" : "Requests for quotation"}
        description={
          isRTL
            ? "ادعُ الموردين، سجّل عروضهم، قارن الأسعار ثم رشّح الأفضل لإنشاء أمر شراء."
            : "Invite suppliers, record their quotes, compare prices and award the best one."
        }
        actions={
          roleAccess.canCreate() ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              {isRTL ? "طلب عرض جديد" : "New RFQ"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "طلبات العروض" : "Total RFQs"} value={stats.total || totalCount} subtitle={isRTL ? "كل الطلبات" : "All requests"} icon={ClipboardList} tone="brand" />
        <StatCard title={isRTL ? "مرسلة" : "Sent"} value={stats.sent || 0} subtitle={isRTL ? "بانتظار العروض" : "Awaiting quotes"} icon={Send} tone="info" />
        <StatCard title={isRTL ? "عروض مستلمة" : "Quotes in"} value={stats.responsesReceived || 0} subtitle={isRTL ? "جاهزة للمقارنة" : "Ready to compare"} icon={MessageSquareQuote} tone="warning" />
        <StatCard title={isRTL ? "تمت الترسية" : "Awarded"} value={stats.awarded || 0} subtitle={isRTL ? "تحولت لأوامر شراء" : "Converted to orders"} icon={Award} tone="success" />
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
              placeholder={isRTL ? "ابحث برقم الطلب أو العنوان..." : "Search RFQ or title..."}
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
            <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="Draft">{isRTL ? "مسودة" : "Draft"}</SelectItem>
              <SelectItem value="Sent">{isRTL ? "مرسل" : "Sent"}</SelectItem>
              <SelectItem value="ResponsesReceived">{isRTL ? "عروض مستلمة" : "Quotes received"}</SelectItem>
              <SelectItem value="Awarded">{isRTL ? "تمت الترسية" : "Awarded"}</SelectItem>
              <SelectItem value="Cancelled">{isRTL ? "ملغي" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            {isRTL ? "جارٍ التحميل..." : "Loading RFQs..."}
          </CardContent>
        ) : rfqs.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              <ClipboardList className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isRTL ? "لا توجد طلبات عروض" : "No RFQs yet"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {isRTL
                ? "ابدأ بطلب عرض سعر وادعُ مورديك لمقارنة الأسعار."
                : "Start an RFQ and invite suppliers to compare their prices."}
            </p>
            {roleAccess.canCreate() && (
              <Button className="mt-5" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                {isRTL ? "طلب عرض جديد" : "New RFQ"}
              </Button>
            )}
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "الطلب" : "RFQ"}</TableHead>
                  <TableHead>{isRTL ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{isRTL ? "الموردون" : "Suppliers"}</TableHead>
                  <TableHead>{isRTL ? "آخر موعد" : "Due"}</TableHead>
                  <TableHead>{isRTL ? "القيمة المستهدفة" : "Target value"}</TableHead>
                  <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((rfq) => {
                  const quoted = rfq.suppliers.filter((s) => s.status === "Quoted");
                  return (
                    <TableRow key={rfq.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        <button className="whitespace-nowrap hover:text-brand-600" onClick={() => setDetails(rfq)}>
                          {rfq.rfqNumber}
                        </button>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-slate-600 dark:text-slate-300">{rfq.title}</TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400">
                        {rfq.suppliers.length}
                        {quoted.length > 0 && (
                          <span className="ms-1 text-emerald-600 dark:text-emerald-400">({quoted.length} {isRTL ? "عرض" : "quoted"})</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {new Date(rfq.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(rfq.totalTargetValue)}
                      </TableCell>
                      <TableCell><Badge className={statusTone(rfq.status)}>{rfq.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon-sm" onClick={() => setDetails(rfq)} aria-label="View RFQ">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {roleAccess.canEdit() && rfq.status === "Draft" && (
                            <Button variant="ghost" size="icon-sm" onClick={() => changeStatus(rfq, "Sent")} aria-label="Send RFQ">
                              <Send className="h-4 w-4 text-sky-600" />
                            </Button>
                          )}
                          {roleAccess.canDelete() && rfq.status === "Draft" && (
                            <Button variant="ghost" size="icon-sm" onClick={() => remove(rfq)} aria-label="Delete RFQ">
                              <Trash2 className="h-4 w-4 text-rose-500" />
                            </Button>
                          )}
                          {roleAccess.canEdit() && rfq.status === "Awarded" && rfq.purchaseOrderId && (
                            <Button variant="ghost" size="sm" onClick={() => navigate("/purchase-orders")}>
                              {rfq.purchaseOrderNumber}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "طلب" : `RFQ${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <RfqModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => { setShowForm(false); refetch(); }}
      />

      <RfqQuoteModal
        isOpen={!!quoteTarget}
        rfq={quoteTarget?.rfq || null}
        supplier={quoteTarget?.supplier || null}
        onClose={() => setQuoteTarget(null)}
        onSuccess={() => { setQuoteTarget(null); refreshDetails(); }}
      />

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{details?.rfqNumber} — {details?.title}</DialogTitle>
          </DialogHeader>
          {details && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-slate-400">{isRTL ? "الحالة" : "Status"}</p><Badge className={statusTone(details.status)}>{details.status}</Badge></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "آخر موعد" : "Due date"}</p><p className="font-medium">{new Date(details.dueDate).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "القيمة المستهدفة" : "Target value"}</p><p className="font-medium">{formatCurrency(details.totalTargetValue)}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "أمر الشراء" : "Purchase order"}</p><p className="font-medium">{details.purchaseOrderNumber || "-"}</p></div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr><th className="px-3 py-2 text-start">{isRTL ? "البند" : "Item"}</th><th className="px-3 py-2 text-end">{isRTL ? "الكمية" : "Qty"}</th><th className="px-3 py-2 text-end">{isRTL ? "السعر المستهدف" : "Target"}</th><th className="px-3 py-2 text-end">{isRTL ? "الإجمالي" : "Total"}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.items.map((line) => (
                      <tr key={line.id}>
                        <td className="px-3 py-2">{line.description}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{line.quantity}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{formatCurrency(line.targetUnitPrice)}</td>
                        <td className="px-3 py-2 text-end font-medium tabular-nums">{formatCurrency(line.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {isRTL ? "الموردون والعروض" : "Suppliers and quotes"}
                </h4>
                <div className="space-y-2">
                  {details.suppliers.map((supplier) => (
                    <div key={supplier.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{supplier.supplierName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {supplier.status === "Quoted"
                            ? `${formatCurrency(supplier.total)} · ${isRTL ? "صالح حتى" : "valid until"} ${supplier.validUntil ? new Date(supplier.validUntil).toLocaleDateString() : "-"}`
                            : supplier.status}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {roleAccess.canEdit() && ["Sent", "ResponsesReceived"].includes(details.status) && (
                          <Button variant="outline" size="sm" onClick={() => setQuoteTarget({ rfq: details, supplier })}>
                            <MessageSquareQuote className="h-4 w-4" />
                            {supplier.status === "Quoted" ? (isRTL ? "تعديل العرض" : "Edit quote") : (isRTL ? "تسجيل عرض" : "Record quote")}
                          </Button>
                        )}
                        {roleAccess.canEdit() && supplier.status === "Quoted" && !details.awardedSupplierId && ["Sent", "ResponsesReceived"].includes(details.status) && (
                          <Button size="sm" onClick={() => award(details, supplier)} loading={awardMutation.isPending}>
                            <Award className="h-4 w-4" />
                            {isRTL ? "ترسية" : "Award"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {details.notes && (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{details.notes}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetails(null)}>{isRTL ? "إغلاق" : "Close"}</Button>
            {roleAccess.canEdit() && details?.status === "Draft" && (
              <Button onClick={() => changeStatus(details, "Sent")}><Send className="h-4 w-4" />{isRTL ? "إرسال للموردين" : "Send to suppliers"}</Button>
            )}
            {roleAccess.canEdit() && details && ["Sent", "ResponsesReceived"].includes(details.status) && (
              <Button variant="outline" onClick={() => changeStatus(details, "Cancelled")}><X className="h-4 w-4" />{isRTL ? "إلغاء" : "Cancel"}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestForQuotations;
