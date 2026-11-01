import React, { useMemo, useState } from "react";
import { Calculator, Download, FileText, ReceiptText } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEInvoices, useVatReturn } from "@/hooks/useTax";
import { formatCurrency } from "@/Helpers/formatCurrency";

const startOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
};

const TaxReports: React.FC = () => {
  const { isRTL } = useLanguage();
  const [fromDate, setFromDate] = useState(startOfMonth());
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const { data: vatResponse, isLoading } = useVatReturn(fromDate, toDate);
  const { data: eInvoiceResponse, refetch: refetchEInvoices } = useEInvoices(fromDate, toDate);
  const vat = vatResponse?.success ? vatResponse.data : undefined;

  const exportJson = useMemo(
    () => JSON.stringify(eInvoiceResponse?.success ? eInvoiceResponse.data : {}, null, 2),
    [eInvoiceResponse]
  );

  const download = () => {
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `e-invoices-${fromDate}-to-${toDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "الضرائب" : "Tax"}
        title={isRTL ? "الإقرار الضريبي والتصدير" : "VAT return and e-invoice export"}
        description={
          isRTL
            ? "ملخص ضريبة المخرجات والمدخلات، مع تصدير فواتير JSON للتكامل الخارجي."
            : "Output and input VAT summary, plus a generic JSON e-invoice export for external integration."
        }
        actions={
          <Button variant="outline" onClick={download} disabled={!eInvoiceResponse?.success}>
            <Download className="h-4 w-4" />
            {isRTL ? "تصدير JSON" : "Export JSON"}
          </Button>
        }
      />

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5"><Label>{isRTL ? "من تاريخ" : "From date"}</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label={isRTL ? "من تاريخ" : "From date"} /></div>
          <div className="space-y-1.5"><Label>{isRTL ? "إلى تاريخ" : "To date"}</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label={isRTL ? "إلى تاريخ" : "To date"} /></div>
          <Button variant="outline" onClick={() => refetchEInvoices()}><FileText className="h-4 w-4" />{isRTL ? "تحديث التصدير" : "Refresh export"}</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "مبيعات خاضعة" : "Sales taxable"} value={formatCurrency(vat?.salesTaxable || 0)} subtitle={isRTL ? "قبل الضريبة" : "Before VAT"} icon={ReceiptText} tone="brand" />
        <StatCard title={isRTL ? "ضريبة المخرجات" : "Output VAT"} value={formatCurrency(vat?.outputVat || 0)} subtitle={isRTL ? "على المبيعات" : "On sales"} icon={Calculator} tone="warning" />
        <StatCard title={isRTL ? "ضريبة المدخلات" : "Input VAT"} value={formatCurrency(vat?.inputVat || 0)} subtitle={isRTL ? "على المشتريات" : "On purchases"} icon={Calculator} tone="info" />
        <StatCard title={isRTL ? "الصافي المستحق" : "Net VAT"} value={formatCurrency(vat?.netVat || 0)} subtitle={isRTL ? "مخرجات - مدخلات" : "Output - input"} icon={Calculator} tone="success" />
      </div>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{isRTL ? "جارٍ التحميل..." : "Loading VAT return..."}</CardContent>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead><TableHead>{isRTL ? "المستند" : "Document"}</TableHead><TableHead>{isRTL ? "النوع" : "Type"}</TableHead><TableHead>{isRTL ? "الطرف" : "Party"}</TableHead><TableHead className="text-end">{isRTL ? "الوعاء" : "Taxable"}</TableHead><TableHead className="text-end">{isRTL ? "الضريبة" : "VAT"}</TableHead><TableHead className="text-end">{isRTL ? "الإجمالي" : "Total"}</TableHead></TableRow></TableHeader>
            <TableBody>
              {vat?.lines.map((line, index) => (
                <TableRow key={`${line.number}-${index}`}>
                  <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(line.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-white">{line.number}</TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400">{line.documentType}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-slate-500 dark:text-slate-400">{line.partyName || "-"}</TableCell>
                  <TableCell className="text-end tabular-nums">{formatCurrency(line.taxableAmount)}</TableCell>
                  <TableCell className="text-end tabular-nums">{formatCurrency(line.vatAmount)}</TableCell>
                  <TableCell className="text-end font-medium tabular-nums">{formatCurrency(line.total)}</TableCell>
                </TableRow>
              ))}
              {(!vat || vat.lines.length === 0) && <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">{isRTL ? "لا توجد مستندات في هذه الفترة." : "No documents in this period."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default TaxReports;
