import React, { useState } from "react";
import {
  Edit,
  Eye,
  Plus,
  Search,
  Tags,
  Trash2,
  Users,
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
  useAssignPriceListCustomer,
  useDeletePriceList,
  usePriceLists,
  useUnassignPriceListCustomer,
} from "@/hooks/usePricing";
import { useCustomers } from "@/hooks/useCustomers";
import PriceListModal from "@/components/modals/PriceListModal";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { PriceListDto } from "@/types/api";

const PriceLists: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PriceListDto | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState("");

  const { data: response, isLoading, refetch } = usePriceLists(pagination, {
    search: search || undefined,
    isActive: status === "all" ? undefined : status === "active",
  });
  const { data: customerResponse } = useCustomers({ pageNumber: 1, pageSize: 300 });
  const deleteMutation = useDeletePriceList();
  const assignMutation = useAssignPriceListCustomer();
  const unassignMutation = useUnassignPriceListCustomer();

  const lists = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;
  const details = lists.find((list) => list.id === detailsId) || null;
  const customers = customerResponse?.success ? customerResponse.data?.data || [] : [];

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (list: PriceListDto) => {
    setEditing(list);
    setShowForm(true);
  };

  const remove = async (list: PriceListDto) => {
    try {
      await deleteMutation.mutateAsync(list.id);
      toast.success(isRTL ? "تم حذف قائمة الأسعار" : "Price list deleted");
      if (detailsId === list.id) setDetailsId(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not delete price list");
    }
  };

  const assign = async () => {
    if (!details || !assignCustomerId) return;
    try {
      await assignMutation.mutateAsync({ id: details.id, customerId: assignCustomerId });
      toast.success(isRTL ? "تم تعيين العميل" : "Customer assigned");
      setAssignCustomerId("");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not assign customer");
    }
  };

  const unassign = async (customerId: string) => {
    if (!details) return;
    try {
      await unassignMutation.mutateAsync({ id: details.id, customerId });
      toast.success(isRTL ? "تمت إزالة العميل" : "Customer removed");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not remove customer");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المبيعات" : "Sales"}
        title={isRTL ? "قوائم الأسعار" : "Price lists"}
        description={
          isRTL
            ? "أسعار حسب العميل والكمية، مع قائمة افتراضية وتواريخ صلاحية."
            : "Customer- and quantity-specific prices, with default lists and validity dates."
        }
        actions={
          roleAccess.canCreate() ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {isRTL ? "قائمة أسعار جديدة" : "New price list"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "قوائم الأسعار" : "Price lists"} value={stats.total || totalCount} subtitle={isRTL ? "كل القوائم" : "All lists"} icon={Tags} tone="brand" />
        <StatCard title={isRTL ? "نشطة" : "Active"} value={stats.active || 0} subtitle={isRTL ? "صالحة للاستخدام" : "Available for pricing"} icon={Tags} tone="success" />
        <StatCard title={isRTL ? "الافتراضية" : "Default"} value={stats.defaultLists || 0} subtitle={isRTL ? "قائمة احتياطية" : "Fallback list"} icon={Tags} tone="info" />
        <StatCard title={isRTL ? "عملاء معيّنون" : "Assigned customers"} value={stats.assignedCustomers || 0} subtitle={isRTL ? "أسعار خاصة" : "Customer pricing"} icon={Users} tone="warning" />
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageNumber: 1 })); }} placeholder={isRTL ? "ابحث باسم القائمة..." : "Search price list..."} className="ps-9" />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="active">{isRTL ? "نشطة" : "Active"}</SelectItem>
              <SelectItem value="inactive">{isRTL ? "غير نشطة" : "Inactive"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{isRTL ? "جارٍ التحميل..." : "Loading price lists..."}</CardContent>
        ) : lists.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"><Tags className="h-7 w-7" /></div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isRTL ? "لا توجد قوائم أسعار" : "No price lists yet"}</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{isRTL ? "أنشئ قائمة أسعار وحدد أسعار الأصناف والكميات." : "Create a price list with item and quantity pricing."}</p>
            {roleAccess.canCreate() && <Button className="mt-5" onClick={openCreate}><Plus className="h-4 w-4" />{isRTL ? "قائمة أسعار جديدة" : "New price list"}</Button>}
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>{isRTL ? "القائمة" : "Price list"}</TableHead><TableHead>{isRTL ? "العملة" : "Currency"}</TableHead><TableHead>{isRTL ? "الصلاحية" : "Validity"}</TableHead><TableHead>{isRTL ? "الأسعار" : "Prices"}</TableHead><TableHead>{isRTL ? "العملاء" : "Customers"}</TableHead><TableHead>{isRTL ? "الحالة" : "Status"}</TableHead><TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead></TableRow></TableHeader>
              <TableBody>
                {lists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white"><button className="hover:text-brand-600" onClick={() => setDetailsId(list.id)}>{list.name}{list.isDefault && <Badge className="ms-2 border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">{isRTL ? "افتراضية" : "Default"}</Badge>}</button></TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{list.currency || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(list.validFrom).toLocaleDateString()}{list.validTo ? ` — ${new Date(list.validTo).toLocaleDateString()}` : ""}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{list.itemCount}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{list.customerCount}</TableCell>
                    <TableCell><Badge className={list.isActive ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}>{list.isActive ? (isRTL ? "نشطة" : "Active") : (isRTL ? "غير نشطة" : "Inactive")}</Badge></TableCell>
                    <TableCell><div className="flex justify-end gap-0.5"><Button variant="ghost" size="icon-sm" onClick={() => setDetailsId(list.id)} aria-label="View price list"><Eye className="h-4 w-4" /></Button>{roleAccess.canEdit() && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(list)} aria-label="Edit price list"><Edit className="h-4 w-4" /></Button>}{roleAccess.canDelete() && <Button variant="ghost" size="icon-sm" onClick={() => remove(list)} aria-label="Delete price list"><Trash2 className="h-4 w-4 text-rose-500" /></Button>}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "قائمة" : `list${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <PriceListModal isOpen={showForm} priceList={editing} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch(); }} />

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetailsId(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{details?.name}</DialogTitle></DialogHeader>
          {details && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-slate-400">{isRTL ? "الحالة" : "Status"}</p><Badge className={details.isActive ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-slate-200 bg-slate-50 text-slate-600"}>{details.isActive ? (isRTL ? "نشطة" : "Active") : (isRTL ? "غير نشطة" : "Inactive")}</Badge></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "العملة" : "Currency"}</p><p className="font-medium">{details.currency || "-"}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "تبدأ" : "Valid from"}</p><p className="font-medium">{new Date(details.validFrom).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "تنتهي" : "Valid to"}</p><p className="font-medium">{details.validTo ? new Date(details.validTo).toLocaleDateString() : "-"}</p></div>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"><tr><th className="px-3 py-2 text-start">{isRTL ? "الصنف" : "Item"}</th><th className="px-3 py-2 text-end">{isRTL ? "السعر" : "Price"}</th><th className="px-3 py-2 text-end">{isRTL ? "الكمية" : "Quantity"}</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.items.map((item) => (
                      <tr key={item.id}><td className="px-3 py-2">{item.itemName}</td><td className="px-3 py-2 text-end font-medium tabular-nums">{formatCurrency(item.unitPrice)}</td><td className="px-3 py-2 text-end tabular-nums">{item.minQuantity}{item.maxQuantity ? ` — ${item.maxQuantity}` : "+"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {roleAccess.canEdit() && (
                <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{isRTL ? "عملاء بهذه القائمة" : "Customers on this list"}</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select value={assignCustomerId} onValueChange={setAssignCustomerId}>
                      <SelectTrigger className="flex-1" aria-label={isRTL ? "العميل" : "Customer"}><SelectValue placeholder={isRTL ? "اختر العميل" : "Choose customer"} /></SelectTrigger>
                      <SelectContent>{customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button onClick={assign} disabled={!assignCustomerId} loading={assignMutation.isPending}>{isRTL ? "تعيين" : "Assign"}</Button>
                  </div>
                  {details.customerIds.length === 0 ? <p className="text-xs text-slate-500">{isRTL ? "لا يوجد عملاء معيّنون." : "No customers assigned yet."}</p> : (
                    <div className="flex flex-wrap gap-2">
                      {details.customerIds.map((customerId, index) => (
                        <span key={customerId} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-xs dark:border-slate-700">
                          {details.customerNames[index]}
                          <button onClick={() => unassign(customerId)} aria-label="Remove customer" className="text-rose-500">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {details.notes && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{details.notes}</p>}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailsId(null)}>{isRTL ? "إغلاق" : "Close"}</Button>{roleAccess.canEdit() && <Button onClick={() => { setDetailsId(null); openEdit(details!); }}>{isRTL ? "تعديل" : "Edit"}</Button>}</DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PriceLists;
