import React, { useState } from "react";
import { Eye, History, Search, ShieldCheck } from "lucide-react";
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
import { useAuditLogs } from "@/hooks/useAuditLogs";
import SavedViewBar from "@/components/SavedViewBar";
import type { AuditLogDto } from "@/types/api";

const actionTone = (action: string) => {
  switch (action) {
    case "Added":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Modified":
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "Deleted":
      return "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
};

const ActivityLog: React.FC = () => {
  const { isRTL } = useLanguage();
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [action, setAction] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 15 });
  const [details, setDetails] = useState<AuditLogDto | null>(null);

  const { data: response, isLoading } = useAuditLogs(pagination, {
    search: search || undefined,
    entityType: entityType === "all" ? undefined : entityType,
    action: action === "all" ? undefined : action,
  });

  const logs = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;

  const prettyChanges = (value?: string) => {
    if (!value) return "";
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "الحوكمة" : "Governance"}
        title={isRTL ? "سجل النشاط" : "Activity log"}
        description={
          isRTL
            ? "تتبّع كل تغيير مالي أو إداري مع المستخدم والوقت والتفاصيل."
            : "Trace every financial or administrative change with user, time and details."
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "كل الأحداث" : "Total events"} value={stats.total || totalCount} subtitle={isRTL ? "آخر الأحداث" : "Recent events"} icon={History} tone="brand" />
        <StatCard title={isRTL ? "إضافة" : "Created"} value={stats.created || 0} subtitle={isRTL ? "مستندات وبيانات جديدة" : "New records"} icon={ShieldCheck} tone="success" />
        <StatCard title={isRTL ? "تعديل" : "Updated"} value={stats.updated || 0} subtitle={isRTL ? "تغييرات على البيانات" : "Changed records"} icon={History} tone="warning" />
        <StatCard title={isRTL ? "حذف" : "Deleted"} value={stats.deleted || 0} subtitle={isRTL ? "سجلات محذوفة" : "Removed records"} icon={History} tone="danger" />
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageNumber: 1 })); }} placeholder={isRTL ? "ابحث بالمستند أو المستخدم..." : "Search document or user..."} className="ps-9" />
          </div>
          <Select value={entityType} onValueChange={(value) => { setEntityType(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
            <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الأنواع" : "All entities"}</SelectItem>
              {["Invoice", "Quotation", "PurchaseOrder", "GoodsReceiptNote", "Customer", "Item", "Transaction", "JournalEntry", "ApprovalRequest"].map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={(value) => { setAction(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
            <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الإجراءات" : "All actions"}</SelectItem>
              <SelectItem value="Added">{isRTL ? "إضافة" : "Created"}</SelectItem>
              <SelectItem value="Modified">{isRTL ? "تعديل" : "Updated"}</SelectItem>
              <SelectItem value="Deleted">{isRTL ? "حذف" : "Deleted"}</SelectItem>
            </SelectContent>
          </Select>
          <SavedViewBar
            pageKey="activity"
            currentQuery={{
              search: search || undefined,
              entityType: entityType === "all" ? undefined : entityType,
              action: action === "all" ? undefined : action,
            }}
            onApply={(query) => {
              setSearch(query.search || "");
              setEntityType(query.entityType || "all");
              setAction(query.action || "all");
              setPagination((p) => ({ ...p, pageNumber: 1 }));
            }}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{isRTL ? "جارٍ التحميل..." : "Loading activity..."}</CardContent>
        ) : logs.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"><History className="h-7 w-7" /></div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isRTL ? "لا يوجد نشاط بعد" : "No activity yet"}</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{isRTL ? "ستظهر هنا التغييرات المالية والإدارية." : "Financial and administrative changes will appear here."}</p>
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>{isRTL ? "الوقت" : "When"}</TableHead><TableHead>{isRTL ? "المستخدم" : "User"}</TableHead><TableHead>{isRTL ? "الإجراء" : "Action"}</TableHead><TableHead>{isRTL ? "النوع" : "Entity"}</TableHead><TableHead>{isRTL ? "المستند" : "Record"}</TableHead><TableHead className="text-end">{isRTL ? "تفاصيل" : "Details"}</TableHead></TableRow></TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{log.userName || "-"}</TableCell>
                    <TableCell><Badge className={actionTone(log.action)}>{log.action}</Badge></TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{log.entityType}</TableCell>
                    <TableCell className="max-w-[220px] truncate font-medium text-slate-900 dark:text-white">{log.entityLabel || log.entityId}</TableCell>
                    <TableCell><div className="flex justify-end"><Button variant="ghost" size="icon-sm" onClick={() => setDetails(log)} aria-label="View audit entry"><Eye className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "حدث" : `event${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{details?.entityType} — {details?.entityLabel || details?.entityId}</DialogTitle></DialogHeader>
          {details && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-400">{isRTL ? "الإجراء" : "Action"}</p><Badge className={actionTone(details.action)}>{details.action}</Badge></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "المستخدم" : "User"}</p><p className="font-medium">{details.userName || "-"}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "الوقت" : "When"}</p><p className="font-medium">{new Date(details.createdAt).toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "عنوان IP" : "IP address"}</p><p className="font-medium">{details.ipAddress || "-"}</p></div>
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-400">{isRTL ? "التغييرات" : "Changes"}</p>
                <pre className="max-h-80 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-200">{prettyChanges(details.changes) || (isRTL ? "لا توجد تفاصيل" : "No details captured")}</pre>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetails(null)}>{isRTL ? "إغلاق" : "Close"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityLog;
