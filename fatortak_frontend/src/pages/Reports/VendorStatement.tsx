import React, { useState } from "react";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import { useVendorStatement } from "../../hooks/useFinancialReports";
import { useCustomers } from "../../hooks/useCustomers";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatCurrency } from "../../Helpers/formatCurrency";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, ArrowLeft, Truck, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VendorStatement: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: suppliersData } = useCustomers({ pageNumber: 1, pageSize: 1000 }, { isSupplier: true });
  const suppliers = suppliersData?.data?.data || [];
  
  const { data: response, isLoading } = useVendorStatement(selectedVendorId, fromDate, toDate);

  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isRTL ? "كشف حساب مورد" : "Vendor Statement"}</h1>
            <p className="text-sm text-slate-500">{isRTL ? "كشف تفصيلي لمستحقات ومدفوعات المورد" : "Detailed statement of vendor bills and payments"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ReportExportButtons filename="vendor-statement" />
        </div>
      </div>

      <Card className="bg-slate-50 dark:bg-slate-800/50 border-none shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[300px] flex flex-col gap-1">
            <Label className="text-xs">{isRTL ? "اختر المورد" : "Select Vendor"}</Label>
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? "اختر مورداً..." : "Choose a vendor..."} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">{isRTL ? "من" : "From"}</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">{isRTL ? "إلى" : "To"}</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
          </div>
        </CardContent>
      </Card>

      {!selectedVendorId ? (
        <div className="py-20 text-center flex flex-col items-center gap-4 border-2 border-dashed rounded-xl">
           <Truck className="w-12 h-12 text-slate-300" />
           <p className="text-slate-500">{isRTL ? "يرجى اختيار مورد لعرض كشف الحساب" : "Please select a vendor to view their statement"}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800/50 overflow-hidden">
              <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/5">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 font-mono">{isRTL ? "الرصيد الافتتاحي" : "Opening Balance"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-6 pb-6">
                <div className="text-2xl lg:text-3xl font-bold font-mono">{formatCurrency(response?.openingBalance || 0)}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800/50 overflow-hidden">
              <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300 font-mono">{isRTL ? "الرصيد الختامي" : "Closing Balance"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-6 pb-6">
                <div className="text-2xl lg:text-3xl font-bold font-mono">{formatCurrency(response?.closingBalance || 0)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{isRTL ? "تفاصيل كشف الحساب" : "Statement Details"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               {isLoading ? <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                        <TableHead>{isRTL ? "المرجع" : "Reference"}</TableHead>
                        <TableHead>{isRTL ? "البيان" : "Description"}</TableHead>
                        <TableHead className="text-end">{isRTL ? "مدين (-)" : "Debit (-)"}</TableHead>
                        <TableHead className="text-end">{isRTL ? "دائن (+)" : "Credit (+)"}</TableHead>
                        <TableHead className="text-end font-bold">{isRTL ? "الرصيد" : "Balance"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {response?.entries?.map((entry: any, idx: number) => (
                           <TableRow key={idx}>
                              <TableCell className="text-xs">{new Date(entry.date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-xs font-bold text-blue-600">{entry.referenceNumber}</TableCell>
                              <TableCell className="text-sm">{entry.description}</TableCell>
                              <TableCell className="text-end font-mono text-green-600">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</TableCell>
                              <TableCell className="text-end font-mono text-red-600">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</TableCell>
                              <TableCell className="text-end font-mono font-bold">{formatCurrency(entry.runningBalance)}</TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                  </Table>
               )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default VendorStatement;
