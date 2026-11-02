import React, { useState } from "react";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import { useIncomeStatement } from "../../hooks/useFinancialReports";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatCurrency } from "../../Helpers/formatCurrency";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, TrendingUp, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const IncomeStatement: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: response, isLoading } = useIncomeStatement(fromDate, toDate);

  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isRTL ? "قائمة الدخل" : "Income Statement"}</h1>
            <p className="text-sm text-slate-500">{isRTL ? "الأرباح والخسائر عن الفترة" : "Profit and Loss for the period"}</p>
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
          <ReportExportButtons filename="income-statement" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden">
          <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "الإيرادات" : "Revenue"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-6 pb-6">
            <div className="text-2xl lg:text-3xl font-bold font-mono">{formatCurrency(response?.totalRevenue || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden">
          <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "المصروفات" : "Expenses"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-6 pb-6">
            <div className="text-2xl lg:text-3xl font-bold font-mono">{formatCurrency(response?.totalExpenses || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden">
          <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/10">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">{isRTL ? "صافي الدخل" : "Net Income"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-6 pb-6">
            <div className={`text-2xl font-bold font-mono lg:text-3xl ${(response?.netIncome || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{formatCurrency(response?.netIncome || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{isRTL ? "تفاصيل الإيرادات" : "Revenue Breakdown"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {isLoading ? <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? "الحساب" : "Account"}</TableHead>
                    <TableHead className="text-end">{isRTL ? "المبلغ" : "Amount"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {response?.revenueItems?.map((item: any) => (
                    <TableRow key={item.accountId}>
                      <TableCell className="text-sm">{item.accountName}</TableCell>
                      <TableCell className="text-end font-mono font-medium">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
             )}
          </CardContent>
        </Card>

        {/* Expenses Breakdown */}
        <Card>
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{isRTL ? "تفاصيل المصروفات" : "Expenses Breakdown"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {isLoading ? <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? "الحساب" : "Account"}</TableHead>
                    <TableHead className="text-end">{isRTL ? "المبلغ" : "Amount"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {response?.expenseItems?.map((item: any) => (
                    <TableRow key={item.accountId}>
                      <TableCell className="text-sm">{item.accountName}</TableCell>
                      <TableCell className="text-end font-mono font-medium">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IncomeStatement;
