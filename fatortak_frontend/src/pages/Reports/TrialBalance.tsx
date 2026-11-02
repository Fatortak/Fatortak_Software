import React, { useState } from "react";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import { useTrialBalance } from "../../hooks/useFinancialReports";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatCurrency } from "../../Helpers/formatCurrency";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Calculator, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TrialBalance: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: response, isLoading } = useTrialBalance(asOfDate);

  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isRTL ? "ميزان المراجعة" : "Trial Balance"}</h1>
            <p className="text-sm text-slate-500">{isRTL ? "الأرصدة النهائية للحسابات" : "Current balances for all accounts"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">{isRTL ? "حتى تاريخ" : "As of Date"}</Label>
            <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="w-40" />
          </div>
          <ReportExportButtons filename="trial-balance" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden shadow-sm">
          <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "إجمالي المدين" : "Total Debit"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-6 pb-6">
            <div className="text-2xl lg:text-3xl font-bold font-mono">{formatCurrency(response?.totalDebit || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden shadow-sm">
          <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isRTL ? "إجمالي الدائن" : "Total Credit"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-6 pb-6">
            <div className="text-2xl lg:text-3xl font-bold font-mono">{formatCurrency(response?.totalCredit || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white text-slate-900 border-slate-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800 overflow-hidden">
          <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/10">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">{isRTL ? "حالة الاتزان" : "Balance Status"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-6 pb-6">
            <div className="flex items-center gap-3">
              {response?.isBalanced ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <span className="text-xl font-bold uppercase tracking-wide text-green-600 dark:text-green-400">{isRTL ? "متزن" : "Balanced"}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-500 animate-pulse" />
                  <span className="text-xl font-bold uppercase tracking-wide text-red-600 dark:text-red-500">{isRTL ? "غير متزن" : "Unbalanced"}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
          <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{isRTL ? "تفاصيل ميزان المراجعة" : "Trial Balance Details"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? "كود الحساب" : "Code"}</TableHead>
                    <TableHead>{isRTL ? "اسم الحساب" : "Account Name"}</TableHead>
                    <TableHead className="text-end">{isRTL ? "مدين" : "Debit"}</TableHead>
                    <TableHead className="text-end">{isRTL ? "دائن" : "Credit"}</TableHead>
                    <TableHead className="text-end">{isRTL ? "الرصيد" : "Balance"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {response?.items?.map((item: any) => (
                    <TableRow key={item.accountId}>
                      <TableCell className="font-mono text-xs">{item.accountCode}</TableCell>
                      <TableCell className="font-medium">{item.accountName}</TableCell>
                      <TableCell className="text-end font-mono">{formatCurrency(item.closingDebit)}</TableCell>
                      <TableCell className="text-end font-mono">{formatCurrency(item.closingCredit)}</TableCell>
                      <TableCell className="text-end font-mono font-bold">{formatCurrency(item.netBalance)}</TableCell>
                    </TableRow>
                  ))}
                  {(!response?.items || response.items.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                        {isRTL ? "لا توجد حركات حتي هذا التاريخ" : "No entries found as of this date"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrialBalance;
