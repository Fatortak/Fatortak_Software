import React, { useState, useEffect } from "react";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useProjectCostBreakdown } from "../../hooks/useFinancialReports";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatCurrency } from "../../Helpers/formatCurrency";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Loader2, ArrowLeft, PieChart } from "lucide-react";

const ProjectCostBreakdown: React.FC = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";

  const { data: response, isLoading } = useProjectCostBreakdown(projectId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports/project-profitability")}>
            <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isRTL ? "تحليل تكاليف المشروع" : "Project Cost Breakdown"}</h1>
            <p className="text-sm text-slate-50">{response?.projectName}</p>
          </div>
        </div>
        <ReportExportButtons filename="project-cost-breakdown" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800/50 overflow-hidden">
          <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/10">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "إجمالي تكاليف المشروع" : "Total Project Cost"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-6 pb-4">
            <div className="text-2xl lg:text-3xl font-bold font-mono">
              {formatCurrency(response?.totalCost || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 text-white dark:bg-slate-900/40 border-slate-800 dark:border-slate-800/50 overflow-hidden flex items-center justify-center p-4">
           <div className="flex items-center gap-3">
              <PieChart className="w-10 h-10 text-blue-400" />
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Distribution Analysis Active</div>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
             <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{isRTL ? "التكاليف حسب الفئة" : "Costs by Category"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {isLoading ? <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div> : (
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>{isRTL ? "الفئة" : "Category"}</TableHead>
                     <TableHead className="text-end">{isRTL ? "المبلغ" : "Amount"}</TableHead>
                     <TableHead className="text-center">{isRTL ? "النسبة" : "Percentage"}</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {response?.categories?.map((cat: any, idx: number) => (
                     <TableRow key={idx}>
                       <TableCell className="font-medium">{cat.categoryName}</TableCell>
                       <TableCell className="text-end font-mono">{formatCurrency(cat.amount)}</TableCell>
                       <TableCell className="text-center">
                         <div className="flex items-center gap-2 justify-center">
                           <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-brand-600" style={{ width: `${cat.percentage}%` }} />
                           </div>
                           <span className="text-xs font-bold w-10">{cat.percentage.toFixed(1)}%</span>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                   <TableRow className="font-bold bg-slate-50 dark:bg-slate-800/50">
                     <TableCell>{isRTL ? "الإجمالي" : "Total Cost"}</TableCell>
                     <TableCell className="text-end font-mono text-lg">{formatCurrency(response?.totalCost || 0)}</TableCell>
                     <TableCell className="text-center">100%</TableCell>
                   </TableRow>
                 </TableBody>
               </Table>
             )}
          </CardContent>
        </Card>

        <Card className="flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/30 border-dashed border-2">
           <div className="text-center space-y-4">
              <PieChart className="w-20 h-20 text-blue-200 mx-auto" />
              <p className="text-sm text-slate-500 max-w-xs">{isRTL ? "سيظهر الرسم البياني لتوزيع التكاليف هنا عند توفر بيانات كافية" : "Visual cost distribution chart will appear here when more data is available"}</p>
           </div>
        </Card>
      </div>
    </div>
  );
};

export default ProjectCostBreakdown;
