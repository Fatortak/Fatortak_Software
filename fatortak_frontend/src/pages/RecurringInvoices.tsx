import React, { useState } from "react";
import {
  CalendarClock,
  Eye,
  Pause,
  Play,
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
  useDeleteRecurringInvoice,
  useRecurringInvoices,
  useRunRecurringInvoiceNow,
  useUpdateRecurringInvoiceStatus,
} from "@/hooks/useRecurringInvoices";
import RecurringInvoiceModal from "@/components/modals/RecurringInvoiceModal";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { RecurringInvoiceDto } from "@/types/api";

const statusTone = (status: string) => {
  switch (status) {
    case "Active":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Paused":
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "Completed":
      return "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
};

const RecurringInvoices: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [frequency, setFrequency] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [showForm, setShowForm] = useState(false);
  const [details, setDetails] = useState<RecurringInvoiceDto | null>(null);

  const { data: response, isLoading, refetch } = useRecurringInvoices(pagination, {
    search: search || undefined,
    status: status === "all" ? undefined : status,
    frequency: frequency === "all" ? undefined : frequency,
  });
  const statusMutation = useUpdateRecurringInvoiceStatus();
  const runMutation = useRunRecurringInvoiceNow();
  const deleteMutation = useDeleteRecurringInvoice();

  const schedules = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;

  const refreshDetails = async () => {
    const result = await refetch();
    if (details && result.data?.success) {
      const fresh = result.data.data?.data?.find((r) => r.id === details.id);
      setDetails(fresh || null);
    }
  };

  const changeStatus = async (schedule: RecurringInvoiceDto, next: string) => {
    try {
      await statusMutation.mutateAsync({ id: schedule.id, status: next });
      toast.success(isRTL ? "تم تحديث الجدولة" : "Schedule updated");
      await refreshDetails();
    } catch (error: any) {
      toast.error(error?.message || "Could not update schedule");
    }
  };

  const runNow = async (schedule: RecurringInvoiceDto) => {
    try {
      const result = await runMutation.mutateAsync(schedule.id);
      toast.success(
        isRTL
          ? `تم إنشاء فاتورة جديدة (${result.data?.runCount} تشغيل)`
          : `Invoice generated (${result.data?.runCount} run${result.data?.runCount === 1 ? "" : "s"})`
      );
      await refreshDetails();
    } catch (error: any) {
      toast.error(error?.message || "Could not generate invoice");
    }
  };

  const remove = async (schedule: RecurringInvoiceDto) => {
    try {
      await deleteMutation.mutateAsync(schedule.id);
      toast.success(isRTL ? "تم حذف الجدولة" : "Schedule deleted");
      setDetails(null);
    } catch (error: any) {
      toast.error(error?.message || "Could not delete schedule");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المبيعات" : "Sales"}
        title={isRTL ? "الفواتير المتكررة" : "Recurring invoices"}
        description={
          isRTL
            ? "جدول فواتير دورية، أوقفها أو شغّلها يدوياً، ودع النظام ينشئها في موعدها."
            : "Schedule recurring invoices, pause or run them manually, and let the system generate them on time."
        }
        actions={
          roleAccess.canCreate() ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              {isRTL ? "جدولة جديدة" : "New schedule"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "كل الجدولات" : "Total schedules"} value={stats.total || totalCount} subtitle={isRTL ? "دورية" : "Recurring"} icon={CalendarClock} tone="brand" />
        <StatCard title={isRTL ? "نشطة" : "Active"} value={stats.active || 0} subtitle={isRTL ? "تعمل تلقائياً" : "Running automatically"} icon={Play} tone="success" />
        <StatCard title={isRTL ? "موقوفة" : "Paused"} value={stats.paused || 0} subtitle={isRTL ? "متوقفة مؤقتاً" : "Temporarily paused"} icon={Pause} tone="warning" />
        <StatCard title={isRTL ? "مستحقة الآن" : "Due now"} value={stats.due || 0} subtitle={isRTL ? "بانتظار الإنشاء" : "Awaiting generation"} icon={CalendarClock} tone="info" />
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageNumber: 1 })); }} placeholder={isRTL ? "ابحث بالاسم أو العميل..." : "Search name or customer..."} className="ps-9" />
          </div>
          <Select value={frequency} onValueChange={(value) => { setFrequency(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل التكرارات" : "All frequencies"}</SelectItem>
              <SelectItem value="Weekly">{isRTL ? "أسبوعي" : "Weekly"}</SelectItem>
              <SelectItem value="Monthly">{isRTL ? "شهري" : "Monthly"}</SelectItem>
              <SelectItem value="Quarterly">{isRTL ? "ربع سنوي" : "Quarterly"}</SelectItem>
              <SelectItem value="Yearly">{isRTL ? "سنوي" : "Yearly"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="Active">{isRTL ? "نشطة" : "Active"}</SelectItem>
              <SelectItem value="Paused">{isRTL ? "موقوفة" : "Paused"}</SelectItem>
              <SelectItem value="Completed">{isRTL ? "مكتملة" : "Completed"}</SelectItem>
              <SelectItem value="Cancelled">{isRTL ? "ملغاة" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{isRTL ? "جارٍ التحميل..." : "Loading schedules..."}</CardContent>
        ) : schedules.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"><CalendarClock className="h-7 w-7" /></div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isRTL ? "لا توجد فواتير متكررة" : "No recurring invoices yet"}</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{isRTL ? "أنشئ جدولة شهرية أو أسبوعية للفواتير الدورية." : "Create a weekly or monthly schedule for recurring billing."}</p>
            {roleAccess.canCreate() && <Button className="mt-5" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />{isRTL ? "جدولة جديدة" : "New schedule"}</Button>}
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "الجدولة" : "Schedule"}</TableHead>
                  <TableHead>{isRTL ? "العميل" : "Customer"}</TableHead>
                  <TableHead>{isRTL ? "التكرار" : "Frequency"}</TableHead>
                  <TableHead>{isRTL ? "التشغيل التالي" : "Next run"}</TableHead>
                  <TableHead>{isRTL ? "القيمة" : "Value"}</TableHead>
                  <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      <button className="hover:text-brand-600" onClick={() => setDetails(schedule)}>
                        <span className="block whitespace-nowrap">{schedule.recurringNumber}</span>
                        <span className="block max-w-[200px] truncate text-xs font-normal text-slate-500 dark:text-slate-400">{schedule.name}</span>
                      </button>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-slate-600 dark:text-slate-300">{schedule.customerName}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{schedule.frequency}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(schedule.nextRunDate).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(schedule.total)}</TableCell>
                    <TableCell><Badge className={statusTone(schedule.status)}>{schedule.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon-sm" onClick={() => setDetails(schedule)} aria-label="View schedule"><Eye className="h-4 w-4" /></Button>
                        {roleAccess.canEdit() && schedule.status === "Active" && <Button variant="ghost" size="icon-sm" onClick={() => runNow(schedule)} aria-label="Run now"><Play className="h-4 w-4 text-emerald-600" /></Button>}
                        {roleAccess.canEdit() && schedule.status === "Active" && <Button variant="ghost" size="icon-sm" onClick={() => changeStatus(schedule, "Paused")} aria-label="Pause schedule"><Pause className="h-4 w-4 text-amber-600" /></Button>}
                        {roleAccess.canEdit() && schedule.status === "Paused" && <Button variant="ghost" size="icon-sm" onClick={() => changeStatus(schedule, "Active")} aria-label="Resume schedule"><Play className="h-4 w-4 text-emerald-600" /></Button>}
                        {roleAccess.canDelete() && schedule.runCount === 0 && <Button variant="ghost" size="icon-sm" onClick={() => remove(schedule)} aria-label="Delete schedule"><Trash2 className="h-4 w-4 text-rose-500" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "جدولة" : `schedule${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <RecurringInvoiceModal isOpen={showForm} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch(); }} />

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{details?.recurringNumber} — {details?.name}</DialogTitle></DialogHeader>
          {details && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-slate-400">{isRTL ? "الحالة" : "Status"}</p><Badge className={statusTone(details.status)}>{details.status}</Badge></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "العميل" : "Customer"}</p><p className="font-medium">{details.customerName}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "التكرار" : "Frequency"}</p><p className="font-medium">{details.frequency}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "التشغيل التالي" : "Next run"}</p><p className="font-medium">{new Date(details.nextRunDate).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "البداية" : "Start"}</p><p className="font-medium">{new Date(details.startDate).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "النهاية" : "End"}</p><p className="font-medium">{details.endDate ? new Date(details.endDate).toLocaleDateString() : "-"}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "مرات التشغيل" : "Runs"}</p><p className="font-medium">{details.runCount}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "الإرسال التلقائي" : "Auto-send"}</p><p className="font-medium">{details.autoSend ? (isRTL ? "نعم" : "Yes") : (isRTL ? "لا" : "No")}</p></div>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr><th className="px-3 py-2 text-start">{isRTL ? "البند" : "Line"}</th><th className="px-3 py-2 text-end">{isRTL ? "الكمية" : "Qty"}</th><th className="px-3 py-2 text-end">{isRTL ? "السعر" : "Price"}</th><th className="px-3 py-2 text-end">{isRTL ? "الإجمالي" : "Total"}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.items.map((line) => (
                      <tr key={line.id}><td className="px-3 py-2">{line.description}</td><td className="px-3 py-2 text-end tabular-nums">{line.quantity}</td><td className="px-3 py-2 text-end tabular-nums">{formatCurrency(line.unitPrice)}</td><td className="px-3 py-2 text-end font-medium tabular-nums">{formatCurrency(line.lineTotal)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {details.notes && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{details.notes}</p>}
            </div>
          )}
          <DialogFooter className="flex-wrap">
            <Button variant="outline" onClick={() => setDetails(null)}>{isRTL ? "إغلاق" : "Close"}</Button>
            {roleAccess.canEdit() && details?.status === "Active" && <Button onClick={() => runNow(details!)} loading={runMutation.isPending}><Play className="h-4 w-4" />{isRTL ? "تشغيل الآن" : "Run now"}</Button>}
            {roleAccess.canEdit() && details?.status === "Active" && <Button variant="outline" onClick={() => changeStatus(details!, "Paused")}><Pause className="h-4 w-4" />{isRTL ? "إيقاف مؤقت" : "Pause"}</Button>}
            {roleAccess.canEdit() && details?.status === "Paused" && <Button onClick={() => changeStatus(details!, "Active")}><Play className="h-4 w-4" />{isRTL ? "استئناف" : "Resume"}</Button>}
            {roleAccess.canEdit() && details && !["Cancelled", "Completed"].includes(details.status) && <Button variant="outline" onClick={() => changeStatus(details!, "Cancelled")}><X className="h-4 w-4" />{isRTL ? "إلغاء" : "Cancel"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecurringInvoices;
