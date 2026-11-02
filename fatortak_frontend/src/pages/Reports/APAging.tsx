import React, { useState } from "react";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import { useAPAging } from "../../hooks/useFinancialReports";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatCurrency } from "../../Helpers/formatCurrency";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const APAging: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: response, isLoading } = useAPAging(asOfDate);

  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isRTL ? "أعمار ديون الموردين" : "Accounts Payable Aging"}</h1>
            <p className="text-sm text-slate-500">{isRTL ? "تحليل المبالغ المستحقة للموردين" : "Outstanding supplier balances breakdown by age"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">{isRTL ? "حتى تاريخ" : "As of Date"}</Label>
            <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="w-40" />
          </div>
          <ReportExportButtons filename="ap-aging" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: isRTL ? "٠-٣٠ يوم" : "0-30 Days", value: response?.total0To30 },
          { label: isRTL ? "٣١-٦٠ يوم" : "31-60 Days", value: response?.total31To60 },
          { label: isRTL ? "٦١-٩٠ يوم" : "61-90 Days", value: response?.total61To90 },
          { label: isRTL ? "٩١+ يوم" : "91+ Days", value: response?.total91Plus },
        ].map((item, i) => (
          <Card key={i} className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden">
            <CardHeader className="py-1 px-4 border-b border-slate-200/50 dark:border-white/5">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4 pb-4">
              <div className="text-lg lg:text-xl font-bold font-mono">{formatCurrency(item.value || 0)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 flex flex-row items-center justify-between">
           <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{isRTL ? "تفاصيل أعمار الديون" : "Aging Details"}</CardTitle>
           <div className="text-lg font-bold">
              <span className="text-xs font-normal text-slate-500 mr-2 uppercase">{isRTL ? "إجمالي:" : "Total:"}</span>
              {formatCurrency(response?.grandTotal || 0)}
           </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>{isRTL ? "المورد" : "Vendor"}</TableHead>
                 <TableHead className="text-end">0-30</TableHead>
                 <TableHead className="text-end">31-60</TableHead>
                 <TableHead className="text-end">61-90</TableHead>
                 <TableHead className="text-end">91+</TableHead>
                 <TableHead className="text-end font-bold">{isRTL ? "الإجمالي" : "Total"}</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {response?.items?.map((item: any) => (
                 <TableRow key={item.entityId}>
                   <TableCell className="font-medium">{item.entityName}</TableCell>
                   <TableCell className="text-end font-mono">{formatCurrency(item.balance0To30)}</TableCell>
                   <TableCell className="text-end font-mono">{formatCurrency(item.balance31To60)}</TableCell>
                   <TableCell className="text-end font-mono">{formatCurrency(item.balance61To90)}</TableCell>
                   <TableCell className="text-end font-mono">{formatCurrency(item.balance91Plus)}</TableCell>
                   <TableCell className="text-end font-mono font-bold text-blue-600">{formatCurrency(item.totalBalance)}</TableCell>
                 </TableRow>
               ))}
               {(!response?.items || response.items.length === 0) && (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500 italic">No outstanding payables found</TableCell></TableRow>
                )}
             </TableBody>
           </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default APAging;
