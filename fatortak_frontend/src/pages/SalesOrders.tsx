import React, { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  Search,
  Truck,
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useConvertQuotation, useConvertToDeliveryNote, useQuotations } from "@/hooks/useQuotations";
import QuotationDetailsModal from "@/components/modals/QuotationDetailsModal";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { QuotationDto } from "@/types/api";

const statusTone = (status: string) => {
  switch (status) {
    case "Confirmed":
      return "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
    case "Invoiced":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Cancelled":
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }
};

const SalesOrders: React.FC = () => {
  const { isRTL } = useLanguage();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [details, setDetails] = useState<QuotationDto | null>(null);
  const convertMutation = useConvertQuotation();
  const deliveryMutation = useConvertToDeliveryNote();

  const { data: response, isLoading } = useQuotations(pagination, {
    documentType: "SalesOrder",
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });

  const orders = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;

  const handleConvert = async (order: QuotationDto) => {
    try {
      const result = await convertMutation.mutateAsync({ id: order.id });
      toast.success(
        isRTL
          ? `تم إنشاء الفاتورة ${result.data?.invoiceNumber}`
          : `Invoice ${result.data?.invoiceNumber} created`
      );
    } catch (error: any) {
      toast.error(error?.message || "Could not convert sales order");
    }
  };

  const handleDelivery = async (order: QuotationDto) => {
    try {
      const result = await deliveryMutation.mutateAsync(order.id);
      toast.success(
        isRTL
          ? `تم إنشاء إذن التسليم ${result.data?.quotationNumber}`
          : `Delivery note ${result.data?.quotationNumber} created`
      );
    } catch (error: any) {
      toast.error(error?.message || "Could not create delivery note");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المبيعات" : "Sales documents"}
        title={isRTL ? "أوامر البيع" : "Sales orders"}
        description={
          isRTL
            ? "أوامر البيع المؤكدة من عروض الأسعار المقبولة، جاهزة للتحويل إلى فواتير."
            : "Confirmed orders created from accepted quotations, ready to invoice."
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          title={isRTL ? "إجمالي الأوامر" : "Total orders"}
          value={stats.total || totalCount}
          subtitle={isRTL ? "كل أوامر البيع" : "All sales orders"}
          icon={ClipboardList}
          tone="brand"
        />
        <StatCard
          title={isRTL ? "مؤكدة" : "Confirmed"}
          value={stats.confirmed || 0}
          subtitle={isRTL ? "جاهزة للتحويل" : "Ready to invoice"}
          icon={CheckCircle2}
          tone="info"
        />
        <StatCard
          title={isRTL ? "مفوترة" : "Invoiced"}
          value={stats.invoiced || 0}
          subtitle={isRTL ? "تم إنشاء فواتيرها" : "Invoice created"}
          icon={Truck}
          tone="success"
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
              placeholder={isRTL ? "ابحث برقم الأمر أو العميل..." : "Search order or customer..."}
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
              <SelectItem value="Confirmed">{isRTL ? "مؤكد" : "Confirmed"}</SelectItem>
              <SelectItem value="Invoiced">{isRTL ? "مفوتر" : "Invoiced"}</SelectItem>
              <SelectItem value="Cancelled">{isRTL ? "ملغي" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            {isRTL ? "جارٍ تحميل أوامر البيع..." : "Loading sales orders..."}
          </CardContent>
        ) : orders.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              <ClipboardList className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isRTL ? "لا توجد أوامر بيع" : "No sales orders yet"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {isRTL
                ? "حوّل عرض سعر مقبول إلى أمر بيع ليظهر هنا."
                : "Convert an accepted quotation to a sales order to see it here."}
            </p>
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "الأمر" : "Order"}</TableHead>
                  <TableHead>{isRTL ? "العميل" : "Customer"}</TableHead>
                  <TableHead>{isRTL ? "التاريخ" : "Issued"}</TableHead>
                  <TableHead>{isRTL ? "الإجمالي" : "Total"}</TableHead>
                  <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      <button
                        className="whitespace-nowrap hover:text-brand-600"
                        onClick={() => setDetails(order)}
                      >
                        {order.quotationNumber}
                      </button>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-slate-600 dark:text-slate-300">
                      {order.customerName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {new Date(order.issueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusTone(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDetails(order)}
                          aria-label="View sales order"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === "Confirmed" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelivery(order)}
                            aria-label="Create delivery note"
                            title="Create delivery note"
                          >
                            <Truck className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}
                        {order.status === "Confirmed" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleConvert(order)}
                            aria-label="Convert sales order to invoice"
                            title="Convert to invoice"
                          >
                            <ArrowRight className="h-4 w-4 text-brand-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "أمر بيع" : `sales order${totalCount === 1 ? "" : "s"}`}</span>
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

      <QuotationDetailsModal
        isOpen={!!details}
        onClose={() => setDetails(null)}
        quotation={details}
      />
    </div>
  );
};

export default SalesOrders;
