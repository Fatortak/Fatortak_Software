import React, { useState } from "react";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import { useMovementReport } from "../../hooks/useFinancialReports";
import { useAccounts } from "../../hooks/useAccounting";
import { useProjects } from "../../hooks/useProjects";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatCurrency } from "../../Helpers/formatCurrency";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const CashBankReport: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

  const { data: accountsData } = useAccounts({ pageNumber: 1, pageSize: 1000 });
  const accounts = accountsData?.data?.data?.filter((acc: any) => 
    acc.accountType === 6 || 
    acc.accountType === 7 || 
    acc.accountCode?.startsWith("10") ||
    acc.accountCode?.startsWith("11") ||
    acc.accountCode?.startsWith("15") ||
    acc.name.toLowerCase().includes("cash") || 
    acc.name.toLowerCase().includes("bank") || 
    acc.name.includes("عهده") ||
    acc.name.includes("صندوق")
  ) || [];
  
  const { data: projectsData } = useProjects({ pageNumber: 1, pageSize: 1000 });
  const projects = projectsData?.data?.data || [];

  const { data: response, isLoading } = useMovementReport(
    fromDate, 
    toDate, 
    selectedAccountId === "all" ? undefined : selectedAccountId,
    selectedProjectId === "all" ? undefined : selectedProjectId
  );

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  
  const isSingleMode = response?.mode === "SingleAccount";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isRTL ? "حركة الخزنة والبنك" : "Cash & Bank Daybook"}</h1>
            <p className="text-sm text-slate-500">{isRTL ? "سجل يومي لحركات الخزنة والبنك" : "Daily log of all cash and bank transactions"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ReportExportButtons filename="cash-bank-movements" />
        </div>
      </div>

      <Card className="bg-slate-50 dark:bg-slate-800/50 border-none shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px] flex flex-col gap-1">
            <Label className="text-xs">{isRTL ? "الحساب" : "Account"}</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? "الكل" : "All"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? "جميع حسابات الصندوق والبنوك" : "All Cash & Bank Accounts"}</SelectItem>
                {accounts.map((acc: any) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.accountCode} - {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px] flex flex-col gap-1">
            <Label className="text-xs">{isRTL ? "المشروع" : "Project"}</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? "الكل" : "All"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? "الكل" : "All Projects"}</SelectItem>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (selectedAccountId === "all" || isSingleMode) ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <SummaryCard 
                title={isRTL ? "الرصيد الافتتاحي" : "Opening Balance"} 
                amount={response?.openingBalance ?? 0} 
             />
             <SummaryCard 
                title={isRTL ? "إجمالي المقبوضات" : "Total Income"} 
                amount={response?.totalIncome ?? 0} 
                variant="success" 
             />
             <SummaryCard 
                title={isRTL ? "إجمالي المدفوعات" : "Total Expense"} 
                amount={response?.totalExpense ?? 0} 
                variant="danger" 
             />
             <SummaryCard 
                title={isRTL ? "الرصيد الختامي" : "Closing Balance"} 
                amount={response?.closingBalance ?? 0} 
                isHighlight 
             />
          </div>

          <MovementTable movements={response?.movements || []} isRTL={isRTL} showAccount={selectedAccountId === "all"} />
          
          {(!response?.movements || response.movements.length === 0) && (
            <div className="py-20 text-center text-slate-400">
              {isRTL ? "لا توجد حركات مسجلة للفترة المختارة" : "No transactions recorded for the selected period"}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {response?.accounts?.map((acc: any) => (
            <div key={acc.accountId} className="space-y-2">
              <div 
                className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-950 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors border border-slate-200 dark:border-slate-800"
                onClick={() => toggleAccount(acc.accountId)}
              >
                <div className="flex items-center gap-4">
                  {expandedAccounts[acc.accountId] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  <h3 className="font-bold text-lg">{acc.accountName}</h3>
                </div>
                <div className="flex gap-6 text-sm font-mono">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase">{isRTL ? "المقبوضات" : "Income"}</span>
                    <span className="text-green-600">{formatCurrency(acc.totalIncome ?? 0)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase">{isRTL ? "المدفوعات" : "Expense"}</span>
                    <span className="text-red-600">{formatCurrency(acc.totalExpense ?? 0)}</span>
                  </div>
                  <div className="flex flex-col items-end min-w-[120px]">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">{isRTL ? "الرصيد النهائي" : "Net Balance"}</span>
                    <span className="font-bold">{formatCurrency(acc.closingBalance ?? 0)}</span>
                  </div>
                </div>
              </div>

              {expandedAccounts[acc.accountId] && (
                <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-800 ml-2 py-2">
                   <MovementTable movements={acc.movements} isRTL={isRTL} compact />
                </div>
              )}
            </div>
          ))}
          {(!response?.accounts || response.accounts.length === 0) && (
            <div className="py-20 text-center text-slate-400">No cash or bank accounts found.</div>
          )}
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, amount, variant, isHighlight }: { title: string, amount: number, variant?: 'success' | 'danger', isHighlight?: boolean }) => {
  return (
    <Card className={cn(
      "bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800/50 overflow-hidden",
      isHighlight && "shadow-xl border-blue-500/20 dark:border-blue-500/20"
    )}>
      <CardHeader className="py-2 px-6 border-b border-slate-200/50 dark:border-white/5">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 font-mono">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 px-6 pb-6">
        <div className={cn(
          "text-xl lg:text-2xl font-bold font-mono",
          variant === 'success' && "text-green-600",
          variant === 'danger' && "text-red-600"
        )}>{formatCurrency(amount)}</div>
      </CardContent>
    </Card>
  );
};

const MovementTable = ({ movements, isRTL, compact, showAccount }: { movements: any[], isRTL: boolean, compact?: boolean, showAccount?: boolean }) => {
  return (
    <Card className={cn(compact && "border-none shadow-none bg-transparent")}>
      {!compact && (
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
          <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{isRTL ? "تفاصيل الحركات" : "Transaction Details"}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-32">{isRTL ? "التاريخ" : "Date"}</TableHead>
              <TableHead>{isRTL ? "البيان والجهة" : "Category & Detail"}</TableHead>
              <TableHead className="text-end w-32">
                <span className="bg-brand-600 text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                  {isRTL ? "المقبوضات" : "Income"}
                </span>
              </TableHead>
              <TableHead className="text-end w-32">
                <span className="bg-brand-600 text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                  {isRTL ? "المدفوعات" : "Expense"}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements?.map((entry: any, idx: number) => (
              <TableRow key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <TableCell className="text-xs whitespace-nowrap align-top pt-4">{new Date(entry.date).toLocaleDateString()}</TableCell>
                <TableCell className="align-top pt-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center flex-wrap gap-2">
                       <span className="font-bold text-slate-900 dark:text-white text-sm">
                         {entry.contraAccount || "N/A"}
                       </span>
                       {showAccount && (
                         <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-bold border border-blue-100 dark:border-blue-800/50 uppercase tracking-tighter">
                           {entry.accountName}
                         </span>
                       )}
                    </div>
                    
                    {entry.description && entry.description !== entry.contraAccount && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight pr-4">
                        {entry.description}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700">
                        #{entry.entryNumber}
                      </span>
                      {entry.projectName && (
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium italic">
                          • {entry.projectName}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-end font-mono text-green-600 font-bold align-top pt-4">
                  {(entry.income > 0 || entry.debit > 0) ? formatCurrency(entry.income || entry.debit) : '-'}
                </TableCell>
                <TableCell className="text-end font-mono text-red-600 font-bold align-top pt-4">
                  {(entry.expense > 0 || entry.credit > 0) ? formatCurrency(entry.expense || entry.credit) : '-'}
                </TableCell>
              </TableRow>
            ))}
            {(!movements || movements.length === 0) && (
              <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-400">No transactions recorded</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default CashBankReport;
