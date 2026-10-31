import React, { useState } from "react";
import { CheckCircle2, Eye, Search, Truck } from "lucide-react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuotations } from "@/hooks/useQuotations";
import QuotationDetailsModal from "@/components/modals/QuotationDetailsModal";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { QuotationDto } from "@/types/api";

const DeliveryNotes: React.FC = () => {
  const { isRTL } = useLanguage();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [details, setDetails] = useState<QuotationDto | null>(null);

  const { data: response, isLoading } = useQuotations(pagination, {
    documentType: "DeliveryNote",
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });

  const notes = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المبيعات" : "Sales documents"}
        title={isRTL ? "إذون التسليم" : "Delivery notes"}
        description={
          isRTL
            ? "أذون تسليم تم إنشاؤها من أوامر البيع المؤكدة، جاهزة للفاتورة."
            : "Delivery notes generated from confirmed sales orders and ready to invoice."
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard title={isRTL ? "إجمالي الأذون" : "Total notes"} value={stats.total || totalCount} subtitle={isRTL ? "كل الأذون" : "All delivery notes"} icon={Truck} tone="brand" />
        <StatCard title={isRTL ? "تم التسليم" : "Delivered"} value={stats.total || totalCount} subtitle={isRTL ? "جاهزة للفاتورة" : "Ready to invoice"} icon={CheckCircle2} tone="success" />
        <StatCard title={isRTL ? "القيمة" : "Value"} value={formatCurrency(stats.totalAmount || 0)} subtitle={isRTL ? "قيمة التسليمات" : "Delivered value"} icon={Truck} tone="neutral" />
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageNumber: 1 })); }} placeholder={isRTL ? "ابحث برقم الإذن أو العميل..." : "Search delivery note or customer..."} className="ps-9" />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="Delivered">{isRTL ? "تم التسليم" : "Delivered"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{isRTL ? "جارٍ التحميل..." : "Loading delivery notes..."}</CardContent>
        ) : notes.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"><Truck className="h-7 w-7" /></div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isRTL ? "لا توجد أذون تسليم" : "No delivery notes yet"}</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{isRTL ? "أنشئ إذن تسليم من أمر بيع مؤكد." : "Create a delivery note from a confirmed sales order."}</p>
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>{isRTL ? "الإذن" : "Delivery note"}</TableHead><TableHead>{isRTL ? "العميل" : "Customer"}</TableHead><TableHead>{isRTL ? "التاريخ" : "Issued"}</TableHead><TableHead>{isRTL ? "القيمة" : "Value"}</TableHead><TableHead>{isRTL ? "الحالة" : "Status"}</TableHead><TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead></TableRow></TableHeader>
              <TableBody>
                {notes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white"><button className="whitespace-nowrap hover:text-brand-600" onClick={() => setDetails(note)}>{note.quotationNumber}</button></TableCell>
                    <TableCell className="max-w-[180px] truncate text-slate-600 dark:text-slate-300">{note.customerName}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(note.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(note.total)}</TableCell>
                    <TableCell><Badge className="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">{note.status}</Badge></TableCell>
                    <TableCell><div className="flex justify-end"><Button variant="ghost" size="icon-sm" onClick={() => setDetails(note)} aria-label="View delivery note"><Eye className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "إذن" : `delivery note${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <QuotationDetailsModal isOpen={!!details} onClose={() => setDetails(null)} quotation={details} />
    </div>
  );
};

export default DeliveryNotes;
