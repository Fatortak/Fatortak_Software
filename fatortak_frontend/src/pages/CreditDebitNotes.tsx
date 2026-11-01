import React, { useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileMinus2,
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
  useCancelInvoiceNote,
  useDeleteInvoiceNote,
  useInvoiceNotes,
  usePostInvoiceNote,
} from "@/hooks/useInvoiceNotes";
import InvoiceNoteModal from "@/components/modals/InvoiceNoteModal";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { InvoiceNoteDto } from "@/types/api";

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

const CreditDebitNotes: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [noteType, setNoteType] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [showForm, setShowForm] = useState(false);
  const [details, setDetails] = useState<InvoiceNoteDto | null>(null);

  const { data: response, isLoading, refetch } = useInvoiceNotes(pagination, {
    search: search || undefined,
    status: status === "all" ? undefined : status,
    noteType: noteType === "all" ? undefined : noteType,
  });
  const postMutation = usePostInvoiceNote();
  const cancelMutation = useCancelInvoiceNote();
  const deleteMutation = useDeleteInvoiceNote();

  const notes = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;

  const refreshDetails = async () => {
    const result = await refetch();
    if (details && result.data?.success) {
      const fresh = result.data.data?.data?.find((n) => n.id === details.id);
      setDetails(fresh || null);
    }
  };

  const post = async (note: InvoiceNoteDto) => {
    try {
      await postMutation.mutateAsync(note.id);
      toast.success(isRTL ? "تم ترحيل الإشعار" : "Note posted");
      await refreshDetails();
    } catch (error: any) {
      toast.error(error?.message || "Could not post note");
    }
  };

  const cancel = async (note: InvoiceNoteDto) => {
    try {
      await cancelMutation.mutateAsync(note.id);
      toast.success(isRTL ? "تم إلغاء الإشعار" : "Note cancelled");
      await refreshDetails();
    } catch (error: any) {
      toast.error(error?.message || "Could not cancel note");
    }
  };

  const remove = async (note: InvoiceNoteDto) => {
    try {
      await deleteMutation.mutateAsync(note.id);
      toast.success(isRTL ? "تم حذف الإشعار" : "Note deleted");
      setDetails(null);
    } catch (error: any) {
      toast.error(error?.message || "Could not delete note");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المبيعات والمشتريات" : "Sales and purchases"}
        title={isRTL ? "الإشعارات الدائنة والمدينة" : "Credit and debit notes"}
        description={
          isRTL
            ? "عدّل الفواتير الصادرة بإشعارات مرتبطة، مع ترحيل محاسبي وتحديث الرصيد."
            : "Adjust issued invoices with linked notes, accounting reversal and balance updates."
        }
        actions={
          roleAccess.canCreate() ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              {isRTL ? "إشعار جديد" : "New note"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "كل الإشعارات" : "Total notes"} value={stats.total || totalCount} subtitle={isRTL ? "دائن ومدين" : "Credit and debit"} icon={FileMinus2} tone="brand" />
        <StatCard title={isRTL ? "مسودات" : "Drafts"} value={stats.draft || 0} subtitle={isRTL ? "غير مُرحّلة" : "Not posted"} icon={FileMinus2} tone="warning" />
        <StatCard title={isRTL ? "إشعارات دائنة" : "Credit notes"} value={formatCurrency(stats.creditTotal || 0)} subtitle={isRTL ? "تخفيض الفواتير" : "Invoice reductions"} icon={FileMinus2} tone="success" />
        <StatCard title={isRTL ? "إشعارات مدينة" : "Debit notes"} value={formatCurrency(stats.debitTotal || 0)} subtitle={isRTL ? "زيادة الفواتير" : "Invoice increases"} icon={FileMinus2} tone="info" />
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}
              placeholder={isRTL ? "ابحث برقم الإشعار أو الطرف..." : "Search note number or party..."}
              className="ps-9"
            />
          </div>
          <Select value={noteType} onValueChange={(value) => { setNoteType(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الأنواع" : "All types"}</SelectItem>
              <SelectItem value="Credit">{isRTL ? "دائن" : "Credit"}</SelectItem>
              <SelectItem value="Debit">{isRTL ? "مدين" : "Debit"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
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
            {isRTL ? "جارٍ التحميل..." : "Loading notes..."}
          </CardContent>
        ) : notes.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              <FileMinus2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isRTL ? "لا توجد إشعارات" : "No credit or debit notes yet"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {isRTL
                ? "أنشئ إشعاراً مرتبطاً بفاتورة صادرة لتسوية المرتجعات أو الخصومات."
                : "Create a note against an issued invoice to settle returns or discounts."}
            </p>
            {roleAccess.canCreate() && (
              <Button className="mt-5" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                {isRTL ? "إشعار جديد" : "New note"}
              </Button>
            )}
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "الإشعار" : "Note"}</TableHead>
                  <TableHead>{isRTL ? "النوع" : "Type"}</TableHead>
                  <TableHead>{isRTL ? "الطرف" : "Party"}</TableHead>
                  <TableHead>{isRTL ? "الفاتورة الأصلية" : "Original invoice"}</TableHead>
                  <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                  <TableHead>{isRTL ? "الإجمالي" : "Total"}</TableHead>
                  <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      <button className="whitespace-nowrap hover:text-brand-600" onClick={() => setDetails(note)}>{note.noteNumber}</button>
                    </TableCell>
                    <TableCell>
                      <Badge className={note.noteType === "Credit"
                        ? "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
                        : "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"}>
                        {note.noteType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-slate-600 dark:text-slate-300">{note.partyName || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{note.originalInvoiceNumber || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(note.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(note.total)}</TableCell>
                    <TableCell><Badge className={statusTone(note.status)}>{note.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon-sm" onClick={() => setDetails(note)} aria-label="View note"><Eye className="h-4 w-4" /></Button>
                        {roleAccess.canEdit() && note.status === "Draft" && <Button variant="ghost" size="icon-sm" onClick={() => post(note)} aria-label="Post note"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></Button>}
                        {roleAccess.canDelete() && note.status === "Draft" && <Button variant="ghost" size="icon-sm" onClick={() => remove(note)} aria-label="Delete note"><Trash2 className="h-4 w-4 text-rose-500" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "إشعار" : `note${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <InvoiceNoteModal isOpen={showForm} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch(); }} />

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{details?.noteNumber} — {details?.noteType} {isRTL ? "إشعار" : "note"}</DialogTitle></DialogHeader>
          {details && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-slate-400">{isRTL ? "الحالة" : "Status"}</p><Badge className={statusTone(details.status)}>{details.status}</Badge></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "الفاتورة الأصلية" : "Original invoice"}</p><p className="font-medium">{details.originalInvoiceNumber || "-"}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "التاريخ" : "Date"}</p><p className="font-medium">{new Date(details.issueDate).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "الإجمالي" : "Total"}</p><p className="font-semibold">{formatCurrency(details.total)}</p></div>
              </div>
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                <span className="text-xs text-slate-400">{isRTL ? "السبب: " : "Reason: "}</span>{details.reason}
              </p>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr><th className="px-3 py-2 text-start">{isRTL ? "البند" : "Line"}</th><th className="px-3 py-2 text-end">{isRTL ? "الكمية" : "Qty"}</th><th className="px-3 py-2 text-end">{isRTL ? "السعر" : "Price"}</th><th className="px-3 py-2 text-end">{isRTL ? "الإجمالي" : "Total"}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.items.map((line) => (
                      <tr key={line.id}>
                        <td className="px-3 py-2">{line.description}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{line.quantity}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{formatCurrency(line.unitPrice)}</td>
                        <td className="px-3 py-2 text-end font-medium tabular-nums">{formatCurrency(line.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {details.notes && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{details.notes}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetails(null)}>{isRTL ? "إغلاق" : "Close"}</Button>
            {roleAccess.canEdit() && details?.status === "Draft" && <Button onClick={() => post(details!)} loading={postMutation.isPending}><CheckCircle2 className="h-4 w-4" />{isRTL ? "ترحيل" : "Post"}</Button>}
            {roleAccess.canEdit() && details?.status === "Draft" && <Button variant="outline" onClick={() => cancel(details!)}><X className="h-4 w-4" />{isRTL ? "إلغاء" : "Cancel"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreditDebitNotes;
