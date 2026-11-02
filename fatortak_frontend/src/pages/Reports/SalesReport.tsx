import React, { useState } from "react";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import { useSalesReport } from "../../hooks/useFinancialReports";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatCurrency } from "../../Helpers/formatCurrency";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, ArrowLeft, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SalesReport: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: response, isLoading } = useSalesReport(fromDate, toDate);

  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isRTL ? "تقرير المبيعات" : "Sales Report"}</h1>
            <p className="text-sm text-slate-500">{isRTL ? "ملخص المبيعات حسب العميل" : "Sales summary aggregated by customer"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">{isRTL ? "من" : "From"}</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">{isRTL ? "إلى" : "To"}</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
          </div>
          <ReportExportButtons filename="sales-report" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden">
          <CardHeader className="py-1 px-4 border-b border-slate-200/50 dark:border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "إجمالي المبيعات" : "Gross Sales"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-4 pb-4">
            <div className="text-lg lg:text-xl font-bold font-mono">{formatCurrency(response?.totalAmount || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden">
          <CardHeader className="py-1 px-4 border-b border-slate-200/50 dark:border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "إجمالي الضرائب" : "Total Tax"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-4 pb-4">
            <div className="text-lg lg:text-xl font-bold font-mono">{formatCurrency(response?.totalTax || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden">
          <CardHeader className="py-1 px-4 border-b border-slate-200/50 dark:border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "إجمالي الخصم" : "Total Discount"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-4 pb-4">
            <div className="text-lg lg:text-xl font-bold font-mono text-red-600 dark:text-red-400">{formatCurrency(response?.totalDiscount || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden">
          <CardHeader className="py-1 px-4 border-b border-slate-200/50 dark:border-white/10">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">{isRTL ? "صافي المبيعات" : "Net Sales"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-4 pb-4">
            <div className="text-lg lg:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(response?.netSales || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
           {isLoading ? <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? "العميل" : "Customer"}</TableHead>
                    <TableHead className="text-center">{isRTL ? "عدد الفواتير" : "Invoices"}</TableHead>
                    <TableHead className="text-end">{isRTL ? "إجمالي المبلغ" : "Total Amount"}</TableHead>
                    <TableHead className="text-end">{isRTL ? "المحصل" : "Total Paid"}</TableHead>
                    <TableHead className="text-end font-bold">{isRTL ? "المتبقي" : "Remaining"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {response?.items?.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.customerName}</TableCell>
                      <TableCell className="text-center">{item.invoiceCount}</TableCell>
                      <TableCell className="text-end font-mono">{formatCurrency(item.totalAmount)}</TableCell>
                      <TableCell className="text-end font-mono text-green-600">{formatCurrency(item.totalPaid)}</TableCell>
                      <TableCell className="text-end font-mono font-bold text-blue-600">{formatCurrency(item.totalRemaining)}</TableCell>
                    </TableRow>
                  ))}
                  {(!response?.items || response.items.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">No sales data found for this period</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
           )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesReport;
