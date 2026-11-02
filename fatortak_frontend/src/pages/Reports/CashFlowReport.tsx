import React, { useState } from "react";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import { useCashFlow } from "../../hooks/useFinancialReports";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatCurrency } from "../../Helpers/formatCurrency";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, DollarSign, ArrowLeft, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CashFlowReport: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: response, isLoading } = useCashFlow(fromDate, toDate);

  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isRTL ? "قائمة التدفقات النقدية" : "Cash Flow Report"}</h1>
            <p className="text-sm text-slate-500">{isRTL ? "حركة النقدية الواردة والصادرة" : "Cash inflows and outflows analysis"}</p>
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
          <ReportExportButtons filename="cash-flow" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden">
          <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "النقدية في بداية الفترة" : "Beginning Cash"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-6 pb-6">
            <div className="text-2xl lg:text-3xl font-bold font-mono">{formatCurrency(response?.startingCash || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden">
          <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "صافي التغير في النقدية" : "Net Cash Change"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-6 pb-6">
            <div className={`text-2xl lg:text-3xl font-bold font-mono flex items-center gap-2 ${ (response?.netCashChange || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }`}>
               { (response?.netCashChange || 0) >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" /> }
               {formatCurrency(response?.netCashChange || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden">
          <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/10">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">{isRTL ? "النقدية في نهاية الفترة" : "Ending Cash"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-6 pb-6">
            <div className="text-2xl lg:text-3xl font-bold font-mono">{formatCurrency(response?.endingCash || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
          <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{isRTL ? "تفاصيل التدفقات" : "Cash Flow Detail"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
           {isLoading ? (
             <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
           ) : (
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="px-6">{isRTL ? "البند" : "Description"}</TableHead>
                   <TableHead className="px-6 text-end">{isRTL ? "المبلغ" : "Amount"}</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {response?.sections?.map((section: any, idx: number) => (
                   <React.Fragment key={idx}>
                     <TableRow className="bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-100 font-bold">
                       <TableCell colSpan={2} className="px-6 py-2 uppercase text-xs tracking-wide text-blue-600">{section.sectionName}</TableCell>
                     </TableRow>
                     {section.items.map((item: any, iidx: number) => (
                       <TableRow key={iidx}>
                         <TableCell className="px-8 text-sm italic">{item.name}</TableCell>
                         <TableCell className="px-8 text-end font-mono">{formatCurrency(item.amount)}</TableCell>
                       </TableRow>
                     ))}
                     <TableRow className="bg-slate-50/50 dark:bg-slate-800/30 font-bold">
                       <TableCell className="px-6 text-end italic">{isRTL ? "إجمالي" : "Total"} {section.sectionName}</TableCell>
                       <TableCell className="px-6 text-end font-mono text-lg">{formatCurrency(section.total)}</TableCell>
                     </TableRow>
                   </React.Fragment>
                 ))}
               </TableBody>
             </Table>
           )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowReport;
