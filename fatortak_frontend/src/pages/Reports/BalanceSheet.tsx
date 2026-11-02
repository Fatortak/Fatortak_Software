import React, { useState } from "react";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import { useBalanceSheet } from "../../hooks/useFinancialReports";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatCurrency } from "../../Helpers/formatCurrency";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Building2, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BalanceSheet: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: response, isLoading } = useBalanceSheet(asOfDate);

  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isRTL ? "الميزانية العمومية" : "Balance Sheet"}</h1>
            <p className="text-sm text-slate-500">{isRTL ? "قائمة المركز المالي" : "Financial position statement"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">{isRTL ? "حتى تاريخ" : "As of Date"}</Label>
            <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="w-40" />
          </div>
          <ReportExportButtons filename="balance-sheet" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assets Column */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{isRTL ? "الأصول" : "Assets"}</CardTitle>
                  <Building2 className="w-5 h-5 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {response?.assets?.map((item: any) => (
                      <TableRow key={item.accountId} className="hover:bg-transparent">
                        <TableCell className="py-3 px-6 text-sm">{item.accountName}</TableCell>
                        <TableCell className="py-3 px-6 text-end font-mono font-medium">{formatCurrency(item.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800/50 overflow-hidden shadow-sm">
              <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/5">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "إجمالي الأصول" : "Total Assets"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-6 pb-6">
                <div className="text-2xl lg:text-3xl font-bold font-mono">{formatCurrency(response?.totalAssets || 0)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Liabilities & Equity Column */}
          <div className="space-y-6">
             {/* Liabilities */}
             <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 py-3">
                <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{isRTL ? "الالتزامات" : "Liabilities"}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {response?.liabilities?.map((item: any) => (
                      <TableRow key={item.accountId} className="hover:bg-transparent">
                        <TableCell className="py-2 px-6 text-sm italic">{item.accountName}</TableCell>
                        <TableCell className="py-2 px-6 text-end font-mono text-slate-600 dark:text-slate-400">{formatCurrency(item.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <div className="bg-slate-100 text-slate-900 border-t border-slate-200 dark:bg-slate-950 dark:text-white dark:border-white/5 px-4 py-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "إجمالي الالتزامات" : "Total Liabilities"}</span>
                <span className="text-xl font-bold font-mono">{formatCurrency(response?.totalLiabilities || 0)}</span>
              </div>
            </Card>

            {/* Equity */}
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 py-3">
                <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{isRTL ? "حقوق الملكية" : "Equity"}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {response?.equity?.map((item: any) => (
                      <TableRow key={item.accountId} className="hover:bg-transparent">
                        <TableCell className="py-2 px-6 text-sm italic">{item.accountName}</TableCell>
                        <TableCell className="py-2 px-6 text-end font-mono text-slate-600 dark:text-slate-400">{formatCurrency(item.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <div className="bg-slate-100 text-slate-900 border-t border-slate-200 dark:bg-slate-950 dark:text-white dark:border-white/5 px-4 py-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "إجمالي حقوق الملكية" : "Total Equity"}</span>
                <span className="text-xl font-bold font-mono">{formatCurrency(response?.totalEquity || 0)}</span>
              </div>
            </Card>

            {/* L + E Summary */}
            <Card className="bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800/50 overflow-hidden">
              <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {isRTL ? "إجمالي الالتزامات وحقوق الملكية" : "Total Liabilities & Equity"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between py-6 px-6">
                <p className="text-2xl lg:text-3xl font-bold font-mono">
                  {formatCurrency((response?.totalLiabilities || 0) + (response?.totalEquity || 0))}
                </p>
                <div className="flex flex-col items-center">
                   {response?.isBalanced ? (
                     <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Balanced</span>
                     </div>
                   ) : (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-500 animate-pulse">
                        <AlertTriangle className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Unbalanced</span>
                    </div>
                   )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;
