import React, { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Edit,
  Eye,
  FileText,
  Plus,
  Search,
  Send,
  Trash2,
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
  useConvertQuotation,
  useConvertToSalesOrder,
  useDeleteQuotation,
  useQuotations,
  useSendQuotation,
  useUpdateQuotationStatus,
} from "@/hooks/useQuotations";
import QuotationModal from "@/components/modals/QuotationModal";
import QuotationDetailsModal from "@/components/modals/QuotationDetailsModal";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { QuotationDto } from "@/types/api";

const statusTone = (status: string) => {
  switch (status) {
    case "Accepted":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Sent":
      return "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
    case "Converted":
      return "border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300";
    case "Rejected":
    case "Expired":
      return "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300";
    case "Cancelled":
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }
};

const Quotations: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<QuotationDto | null>(null);
  const [details, setDetails] = useState<QuotationDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuotationDto | null>(null);

  const { data: response, isLoading, refetch } = useQuotations(pagination, {
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const deleteMutation = useDeleteQuotation();
  const sendMutation = useSendQuotation();
  const statusMutation = useUpdateQuotationStatus();
  const convertMutation = useConvertQuotation();
  const salesOrderMutation = useConvertToSalesOrder();

  const quotations = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;

  const refresh = () => {
    refetch();
    setShowForm(false);
    setEditing(null);
  };

  const handleSend = async (quotation: QuotationDto) => {
    try {
      await sendMutation.mutateAsync(quotation.id);
      toast.success(isRTL ? "تم تعيين العرض كمرسل" : "Quotation marked as sent");
    } catch (error: any) {
      toast.error(error?.message || "Could not send quotation");
    }
  };

  const handleAccept = async (quotation: QuotationDto) => {
    try {
      await statusMutation.mutateAsync({ id: quotation.id, status: "Accepted" });
      toast.success(isRTL ? "تم قبول العرض" : "Quotation accepted");
    } catch (error: any) {
      toast.error(error?.message || "Could not update quotation");
    }
  };

  const handleConvert = async (quotation: QuotationDto) => {
    try {
      const result = await convertMutation.mutateAsync({ id: quotation.id });
      toast.success(
        isRTL
          ? `تم إنشاء الفاتورة ${result.data?.invoiceNumber}`
          : `Invoice ${result.data?.invoiceNumber} created`
      );
    } catch (error: any) {
      toast.error(error?.message || "Could not convert quotation");
    }
  };

  const handleSalesOrder = async (quotation: QuotationDto) => {
    try {
      const result = await salesOrderMutation.mutateAsync(quotation.id);
      toast.success(
        isRTL
          ? `تم إنشاء أمر البيع ${result.data?.quotationNumber}`
          : `Sales order ${result.data?.quotationNumber} created`
      );
    } catch (error: any) {
      toast.error(error?.message || "Could not create sales order");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(isRTL ? "تم حذف العرض" : "Quotation deleted");
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error?.message || "Could not delete quotation");
    }
  };

  const canConvert = (quotation: QuotationDto) =>
    !quotation.convertedInvoiceId &&
    !quotation.isExpired &&
    !["Converted", "Rejected", "Cancelled", "Expired"].includes(quotation.status);

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المبيعات" : "Sales documents"}
        title={isRTL ? "عروض الأسعار" : "Quotations"}
        description={
          isRTL
            ? "أنشئ عروض الأسعار، تابع قبولها، وحوّل العرض المقبول إلى فاتورة بيع."
            : "Create quotations, track acceptance, and convert an accepted quote into a sales invoice."
        }
        actions={
          roleAccess.canCreate() ? (
            <Button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {isRTL ? "عرض سعر جديد" : "New quotation"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          title={isRTL ? "إجمالي العروض" : "Total quotations"}
          value={stats.total || totalCount}
          subtitle={isRTL ? "كل العروض" : "All quotations"}
          icon={FileText}
          tone="brand"
        />
        <StatCard
          title={isRTL ? "مرسلة" : "Sent"}
          value={stats.sent || 0}
          subtitle={isRTL ? "بانتظار رد العميل" : "Awaiting customer reply"}
          icon={Send}
          tone="info"
        />
        <StatCard
          title={isRTL ? "مقبولة" : "Accepted"}
          value={stats.accepted || 0}
          subtitle={isRTL ? "جاهزة للتحويل" : "Ready to convert"}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          title={isRTL ? "محوّلة" : "Converted"}
          value={stats.converted || 0}
          subtitle={isRTL ? "أصبحت فواتير" : "Turned into invoices"}
          icon={ArrowRight}
          tone="neutral"
        />
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
              placeholder={isRTL ? "ابحث برقم العرض أو العميل..." : "Search quotation or customer..."}
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
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="Draft">{isRTL ? "مسودة" : "Draft"}</SelectItem>
              <SelectItem value="Sent">{isRTL ? "مرسل" : "Sent"}</SelectItem>
              <SelectItem value="Accepted">{isRTL ? "مقبول" : "Accepted"}</SelectItem>
              <SelectItem value="Rejected">{isRTL ? "مرفوض" : "Rejected"}</SelectItem>
              <SelectItem value="Expired">{isRTL ? "منتهي" : "Expired"}</SelectItem>
              <SelectItem value="Converted">{isRTL ? "محوّل" : "Converted"}</SelectItem>
              <SelectItem value="Cancelled">{isRTL ? "ملغي" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            {isRTL ? "جارٍ تحميل العروض..." : "Loading quotations..."}
          </CardContent>
        ) : quotations.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isRTL ? "لا توجد عروض أسعار" : "No quotations yet"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {isRTL
                ? "ابدأ بإنشاء عرض سعر لعميلك، ثم حوّله إلى فاتورة عند القبول."
                : "Create a quotation for a customer, then convert it to an invoice when accepted."}
            </p>
            {roleAccess.canCreate() && (
              <Button
                className="mt-5"
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4" />
                {isRTL ? "عرض سعر جديد" : "New quotation"}
              </Button>
            )}
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "العرض" : "Quotation"}</TableHead>
                  <TableHead>{isRTL ? "العميل" : "Customer"}</TableHead>
                  <TableHead>{isRTL ? "التاريخ" : "Issued"}</TableHead>
                  <TableHead>{isRTL ? "صالح حتى" : "Valid until"}</TableHead>
                  <TableHead>{isRTL ? "الإجمالي" : "Total"}</TableHead>
                  <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      <button
                        className="whitespace-nowrap hover:text-brand-600"
                        onClick={() => setDetails(quotation)}
                      >
                        {quotation.quotationNumber}
                      </button>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-slate-600 dark:text-slate-300">
                      {quotation.customerName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {new Date(quotation.issueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {new Date(quotation.validUntil).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(quotation.total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusTone(quotation.status)}>{quotation.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon-sm" onClick={() => setDetails(quotation)} title="View" aria-label="View quotation">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {roleAccess.canEdit() && ["Draft", "Sent"].includes(quotation.status) && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditing(quotation);
                              setShowForm(true);
                            }}
                            title="Edit" aria-label="Edit quotation"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {roleAccess.canEdit() && quotation.status === "Draft" && (
                          <Button variant="ghost" size="icon-sm" onClick={() => handleSend(quotation)} title="Send" aria-label="Mark quotation as sent">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {roleAccess.canEdit() && ["Draft", "Sent"].includes(quotation.status) && (
                          <Button variant="ghost" size="icon-sm" onClick={() => handleAccept(quotation)} title="Accept" aria-label="Accept quotation">
                            <Check className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}
                        {roleAccess.canEdit() && quotation.status === "Accepted" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleSalesOrder(quotation)}
                            title="Create sales order"
                            aria-label="Convert quotation to sales order"
                          >
                            <ClipboardList className="h-4 w-4 text-sky-600" />
                          </Button>
                        )}
                        {roleAccess.canEdit() && canConvert(quotation) && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleConvert(quotation)}
                            title="Convert to invoice" aria-label="Convert quotation to invoice"
                          >
                            <ArrowRight className="h-4 w-4 text-brand-600" />
                          </Button>
                        )}
                        {roleAccess.canDelete() && quotation.status !== "Converted" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteTarget(quotation)}
                            title="Delete" aria-label="Delete quotation"
                          >
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>
                {isRTL
                  ? `${totalCount} عرض إجمالاً`
                  : `${totalCount} quotation${totalCount === 1 ? "" : "s"}`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.pageNumber <= 1}
                  onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}
                >
                  {isRTL ? "السابق" : "Previous"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.pageNumber * pagination.pageSize >= totalCount}
                  onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}
                >
                  {isRTL ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <QuotationModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSuccess={refresh}
        quotation={editing}
      />
      <QuotationDetailsModal
        isOpen={!!details}
        onClose={() => setDetails(null)}
        quotation={details}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isRTL ? "حذف عرض السعر" : "Delete quotation"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRTL
              ? `هل تريد حذف ${deleteTarget?.quotationNumber}؟ لا يمكن التراجع عن هذا الإجراء.`
              : `Delete ${deleteTarget?.quotationNumber}? This cannot be undone.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleteMutation.isPending}>
              {isRTL ? "حذف" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quotations;
