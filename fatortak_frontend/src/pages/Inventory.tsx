import React, { useState } from "react";
import {
  Boxes,
  Package,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useItems } from "@/hooks/useItems";
import {
  useCreateStockAdjustment,
  useInventoryValuation,
  useStockAdjustments,
} from "@/hooks/useInventory";
import { formatCurrency } from "@/Helpers/formatCurrency";

const Inventory: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [itemId, setItemId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantityChange, setQuantityChange] = useState(1);
  const [unitCost, setUnitCost] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const { data: valuationResponse, isLoading: valuationLoading, refetch: refetchValuation } = useInventoryValuation();
  const { data: adjustmentsResponse, isLoading: adjustmentsLoading, refetch: refetchAdjustments } = useStockAdjustments(pagination, {
    search: search || undefined,
  });
  const { data: itemResponse } = useItems({ pageNumber: 1, pageSize: 300 });
  const createMutation = useCreateStockAdjustment();

  const valuation = valuationResponse?.success ? valuationResponse.data : undefined;
  const adjustments = adjustmentsResponse?.success ? adjustmentsResponse.data?.data || [] : [];
  const stats: any = adjustmentsResponse?.success ? adjustmentsResponse.data?.metaData || {} : {};
  const totalCount = adjustmentsResponse?.success ? adjustmentsResponse.data?.totalCount || 0 : 0;
  const items = itemResponse?.success ? itemResponse.data?.data || [] : [];

  const openAdjustment = () => {
    setItemId("");
    setDate(new Date().toISOString().slice(0, 10));
    setQuantityChange(1);
    setUnitCost("");
    setReason("");
    setNotes("");
    setShowAdjustment(true);
  };

  const submit = async () => {
    if (!itemId) {
      toast.error(isRTL ? "اختر الصنف" : "Select an item");
      return;
    }
    if (!quantityChange) {
      toast.error(isRTL ? "أدخل كمية غير صفرية" : "Enter a non-zero quantity");
      return;
    }
    if (!reason.trim()) {
      toast.error(isRTL ? "أدخل سبب التسوية" : "Enter a reason");
      return;
    }
    try {
      await createMutation.mutateAsync({
        itemId,
        date,
        quantityChange,
        unitCost: unitCost === "" ? undefined : Number(unitCost),
        reason: reason.trim(),
        notes,
      });
      toast.success(isRTL ? "تم تسجيل تسوية المخزون" : "Stock adjustment recorded");
      setShowAdjustment(false);
      refetchValuation();
      refetchAdjustments();
    } catch (error: any) {
      toast.error(error?.message || "Could not record adjustment");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المخزون" : "Inventory"}
        title={isRTL ? "تقييم المخزون والتسويات" : "Inventory valuation and adjustments"}
        description={
          isRTL
            ? "قيمة المخزون بالتكلفة، مع تسويات زيادة/نقصان تعلن فوراً."
            : "Stock value at cost, with immediate increase/decrease adjustments."
        }
        actions={
          roleAccess.canCreate() ? (
            <Button onClick={openAdjustment}><Plus className="h-4 w-4" />{isRTL ? "تسوية مخزون" : "Stock adjustment"}</Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "الأصناف" : "Items"} value={valuation?.itemCount || 0} subtitle={isRTL ? "أصناف نشطة" : "Active items"} icon={Package} tone="brand" />
        <StatCard title={isRTL ? "قيمة المخزون" : "Stock value"} value={formatCurrency(valuation?.totalValue || 0)} subtitle={isRTL ? "بالتكلفة" : "At cost"} icon={Boxes} tone="success" />
        <StatCard title={isRTL ? "مخزون منخفض" : "Low stock"} value={valuation?.lowStockCount || 0} subtitle={isRTL ? "10 أو أقل" : "10 or fewer"} icon={TrendingDown} tone="warning" />
        <StatCard title={isRTL ? "التسويات" : "Adjustments"} value={stats.total || totalCount} subtitle={isRTL ? "حركات مسجلة" : "Recorded movements"} icon={TrendingUp} tone="info" />
      </div>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isRTL ? "تقييم المخزون" : "Inventory valuation"}</h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? "إجمالي الكمية" : "Total quantity"}: {valuation?.totalQuantity || 0}</span>
        </CardContent>
        {valuationLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{isRTL ? "جارٍ التحميل..." : "Loading valuation..."}</CardContent>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>{isRTL ? "الصنف" : "Item"}</TableHead><TableHead>{isRTL ? "الكود" : "Code"}</TableHead><TableHead className="text-end">{isRTL ? "الكمية" : "Quantity"}</TableHead><TableHead className="text-end">{isRTL ? "التكلفة" : "Unit cost"}</TableHead><TableHead className="text-end">{isRTL ? "القيمة" : "Value"}</TableHead><TableHead>{isRTL ? "الحالة" : "Status"}</TableHead></TableRow></TableHeader>
            <TableBody>
              {valuation?.items.map((row) => (
                <TableRow key={row.itemId}>
                  <TableCell className="font-medium text-slate-900 dark:text-white">{row.itemName}</TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400">{row.code || "-"}</TableCell>
                  <TableCell className="text-end tabular-nums">{row.quantity}</TableCell>
                  <TableCell className="text-end tabular-nums">{formatCurrency(row.unitCost)}</TableCell>
                  <TableCell className="text-end font-semibold tabular-nums">{formatCurrency(row.value)}</TableCell>
                  <TableCell>{row.lowStock ? <Badge className="border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">{isRTL ? "منخفض" : "Low"}</Badge> : <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">{isRTL ? "جيد" : "Healthy"}</Badge>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageNumber: 1 })); }} placeholder={isRTL ? "ابحث بالصنف أو السبب..." : "Search item or reason..."} className="ps-9" />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {adjustmentsLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{isRTL ? "جارٍ التحميل..." : "Loading adjustments..."}</CardContent>
        ) : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead><TableHead>{isRTL ? "الصنف" : "Item"}</TableHead><TableHead className="text-end">{isRTL ? "التغيير" : "Change"}</TableHead><TableHead className="text-end">{isRTL ? "التكلفة" : "Unit cost"}</TableHead><TableHead>{isRTL ? "السبب" : "Reason"}</TableHead><TableHead>{isRTL ? "المستخدم" : "User"}</TableHead></TableRow></TableHeader>
              <TableBody>
                {adjustments.map((adjustment) => (
                  <TableRow key={adjustment.id}>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(adjustment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">{adjustment.itemName}</TableCell>
                    <TableCell className={`text-end font-semibold tabular-nums ${adjustment.quantityChange > 0 ? "text-emerald-600" : "text-rose-600"}`}>{adjustment.quantityChange > 0 ? "+" : ""}{adjustment.quantityChange}</TableCell>
                    <TableCell className="text-end tabular-nums text-slate-500">{adjustment.unitCost ? formatCurrency(adjustment.unitCost) : "-"}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-slate-500 dark:text-slate-400">{adjustment.reason}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{adjustment.userName || "-"}</TableCell>
                  </TableRow>
                ))}
                {adjustments.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">{isRTL ? "لا توجد تسويات." : "No stock adjustments yet."}</TableCell></TableRow>}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "تسوية" : `adjustment${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Dialog open={showAdjustment} onOpenChange={setShowAdjustment}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{isRTL ? "تسوية مخزون" : "Stock adjustment"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{isRTL ? "الصنف" : "Item"} *</Label>
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger aria-label={isRTL ? "الصنف" : "Item"}><SelectValue placeholder={isRTL ? "اختر الصنف" : "Choose item"} /></SelectTrigger>
                <SelectContent>{items.map((item: any) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>{isRTL ? "التاريخ" : "Date"}</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label={isRTL ? "التاريخ" : "Date"} /></div>
              <div className="space-y-1.5"><Label>{isRTL ? "التغيير" : "Quantity change"} *</Label><Input type="number" value={quantityChange} onChange={(e) => setQuantityChange(Number(e.target.value) || 0)} aria-label={isRTL ? "التغيير" : "Quantity change"} /></div>
              <div className="space-y-1.5"><Label>{isRTL ? "تكلفة الوحدة" : "Unit cost"}</Label><Input type="number" min={0} step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} aria-label={isRTL ? "تكلفة الوحدة" : "Unit cost"} /></div>
            </div>
            <div className="space-y-1.5"><Label>{isRTL ? "السبب" : "Reason"} *</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={isRTL ? "جرد، تلف، مرتجع..." : "Count, damage, return..."} aria-label={isRTL ? "السبب" : "Reason"} /></div>
            <div className="space-y-1.5"><Label>{isRTL ? "ملاحظات" : "Notes"}</Label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} aria-label={isRTL ? "ملاحظات" : "Notes"} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAdjustment(false)}>{isRTL ? "إلغاء" : "Cancel"}</Button><Button onClick={submit} loading={createMutation.isPending}>{isRTL ? "تسجيل" : "Record"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
