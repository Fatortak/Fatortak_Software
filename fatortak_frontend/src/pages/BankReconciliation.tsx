import React, { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Landmark,
  Link2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAccounts } from "@/hooks/useAccounting";
import {
  fetchBankCandidates,
  useBankAdjustment,
  useBankStatements,
  useDeleteBankStatement,
  useImportBankStatement,
  useMatchBankLine,
  useReconcileBankStatement,
  useToggleIgnoreBankLine,
  useUnmatchBankLine,
} from "@/hooks/useBankReconciliation";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type {
  BankStatementDto,
  BankStatementLineDto,
  BankTransactionCandidateDto,
} from "@/types/api";

const statusTone = (status: string) => {
  switch (status) {
    case "Reconciled":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Ignored":
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "Matched":
      return "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
    default:
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }
};

const BankReconciliation: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const fileInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [showImport, setShowImport] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [matchLine, setMatchLine] = useState<BankStatementLineDto | null>(null);
  const [candidates, setCandidates] = useState<BankTransactionCandidateDto[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [name, setName] = useState("");
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10));
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");

  const { data: response, isLoading, refetch } = useBankStatements(pagination, {
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const { data: accountsResponse } = useAccounts({ pageNumber: 1, pageSize: 300 });
  const accounts = accountsResponse?.success
    ? accountsResponse.data?.data || []
    : [];
  const importMutation = useImportBankStatement();
  const matchMutation = useMatchBankLine();
  const unmatchMutation = useUnmatchBankLine();
  const ignoreMutation = useToggleIgnoreBankLine();
  const adjustmentMutation = useBankAdjustment();
  const reconcileMutation = useReconcileBankStatement();
  const deleteMutation = useDeleteBankStatement();

  const statements = useMemo(
    () => (response?.success ? response.data?.data || [] : []),
    [response]
  );
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;

  const details = useMemo(
    () => statements.find((statement) => statement.id === detailsId) || null,
    [statements, detailsId]
  );

  const resetImport = () => {
    setAccountId("");
    setName("");
    setPeriodStart(new Date().toISOString().slice(0, 10));
    setPeriodEnd(new Date().toISOString().slice(0, 10));
    setOpeningBalance(0);
    setClosingBalance(0);
    setFileName("");
    setCsv("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const submitImport = async () => {
    if (!accountId) {
      toast.error(isRTL ? "اختر الحساب البنكي" : "Select the bank account");
      return;
    }
    if (!name.trim()) {
      toast.error(isRTL ? "أدخل اسم الكشف" : "Enter a statement name");
      return;
    }
    if (!csv.trim()) {
      toast.error(isRTL ? "اختر ملف CSV" : "Choose a CSV file");
      return;
    }
    try {
      const result = await importMutation.mutateAsync({
        accountId,
        name: name.trim(),
        fileName: fileName || undefined,
        periodStart,
        periodEnd,
        openingBalance,
        closingBalance,
        csv,
      });
      toast.success(
        isRTL
          ? `تم استيراد ${result.data?.lineCount || 0} حركة`
          : `${result.data?.lineCount || 0} statement lines imported`
      );
      setShowImport(false);
      resetImport();
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not import statement");
    }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setCsv(await file.text());
  };

  const openMatch = async (statement: BankStatementDto, line: BankStatementLineDto) => {
    setMatchLine(line);
    setCandidates([]);
    setCandidatesLoading(true);
    try {
      const result = await fetchBankCandidates(statement.id, line.id);
      setCandidates(result.data || []);
    } catch (error: any) {
      toast.error(error?.message || "Could not load matching transactions");
    } finally {
      setCandidatesLoading(false);
    }
  };

  const match = async (statement: BankStatementDto, candidate: BankTransactionCandidateDto) => {
    if (!matchLine) return;
    try {
      await matchMutation.mutateAsync({
        statementId: statement.id,
        lineId: matchLine.id,
        transactionId: candidate.id,
      });
      toast.success(isRTL ? "تمت المطابقة" : "Line matched");
      setMatchLine(null);
      setCandidates([]);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not match line");
    }
  };

  const ignore = async (statement: BankStatementDto, line: BankStatementLineDto) => {
    try {
      await ignoreMutation.mutateAsync({ statementId: statement.id, lineId: line.id });
      toast.success(isRTL ? "تم تحديث حالة الحركة" : "Line updated");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not update line");
    }
  };

  const unmatch = async (statement: BankStatementDto, line: BankStatementLineDto) => {
    try {
      await unmatchMutation.mutateAsync({ statementId: statement.id, lineId: line.id });
      toast.success(isRTL ? "تم إلغاء المطابقة" : "Line unmatched");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not unmatch line");
    }
  };

  const adjustment = async (statement: BankStatementDto, line: BankStatementLineDto) => {
    try {
      await adjustmentMutation.mutateAsync({ statementId: statement.id, lineId: line.id });
      toast.success(isRTL ? "تم إنشاء قيد تسوية ومطابقته" : "Adjustment created and matched");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not create adjustment");
    }
  };

  const reconcile = async (statement: BankStatementDto) => {
    try {
      await reconcileMutation.mutateAsync(statement.id);
      toast.success(isRTL ? "تمت تسوية الكشف" : "Statement reconciled");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not reconcile statement");
    }
  };

  const remove = async (statement: BankStatementDto) => {
    try {
      await deleteMutation.mutateAsync(statement.id);
      toast.success(isRTL ? "تم حذف الكشف" : "Statement deleted");
      setDetailsId(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not delete statement");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المحاسبة" : "Accounting"}
        title={isRTL ? "مطابقة البنك" : "Bank reconciliation"}
        description={
          isRTL
            ? "استورد كشوف البنك، طابق الحركات مع القيود، ثم أغلق الكشف."
            : "Import bank statements, match lines to transactions, then close the statement."
        }
        actions={
          roleAccess.canCreate() ? (
            <Button onClick={() => setShowImport(true)}>
              <Upload className="h-4 w-4" />
              {isRTL ? "استيراد كشف" : "Import statement"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "كشوف البنك" : "Statements"} value={stats.total || totalCount} subtitle={isRTL ? "كل الكشوف" : "All statements"} icon={Landmark} tone="brand" />
        <StatCard title={isRTL ? "مفتوحة" : "Open"} value={stats.open || 0} subtitle={isRTL ? "قيد المطابقة" : "In progress"} icon={Landmark} tone="warning" />
        <StatCard title={isRTL ? "مُسوّاة" : "Reconciled"} value={stats.reconciled || 0} subtitle={isRTL ? "مغلقة" : "Closed"} icon={CheckCircle2} tone="success" />
        <StatCard title={isRTL ? "حركات غير مطابقة" : "Unmatched lines"} value={stats.unmatchedLines || 0} subtitle={isRTL ? "تحتاج قراراً" : "Need action"} icon={Link2} tone="danger" />
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageNumber: 1 })); }} placeholder={isRTL ? "ابحث باسم الكشف..." : "Search statement..."} className="ps-9" />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="Open">{isRTL ? "مفتوح" : "Open"}</SelectItem>
              <SelectItem value="Reconciled">{isRTL ? "مُسوّى" : "Reconciled"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{isRTL ? "جارٍ التحميل..." : "Loading statements..."}</CardContent>
        ) : statements.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"><Landmark className="h-7 w-7" /></div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isRTL ? "لا توجد كشوف بنك" : "No bank statements"}</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{isRTL ? "استورد كشف CSV وابدأ المطابقة." : "Import a CSV statement and start matching."}</p>
            {roleAccess.canCreate() && <Button className="mt-5" onClick={() => setShowImport(true)}><Upload className="h-4 w-4" />{isRTL ? "استيراد كشف" : "Import statement"}</Button>}
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>{isRTL ? "الكشف" : "Statement"}</TableHead><TableHead>{isRTL ? "الحساب" : "Account"}</TableHead><TableHead>{isRTL ? "الفترة" : "Period"}</TableHead><TableHead>{isRTL ? "المطابقة" : "Matched"}</TableHead><TableHead>{isRTL ? "الفرق" : "Difference"}</TableHead><TableHead>{isRTL ? "الحالة" : "Status"}</TableHead><TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead></TableRow></TableHeader>
              <TableBody>
                {statements.map((statement) => (
                  <TableRow key={statement.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white"><button className="hover:text-brand-600" onClick={() => setDetailsId(statement.id)}>{statement.name}</button></TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{statement.accountName}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(statement.periodStart).toLocaleDateString()} — {new Date(statement.periodEnd).toLocaleDateString()}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{statement.matchedCount}/{statement.lineCount}</TableCell>
                    <TableCell className={`whitespace-nowrap font-medium tabular-nums ${Math.abs(statement.statementDifference) > 0.01 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>{formatCurrency(statement.statementDifference)}</TableCell>
                    <TableCell><Badge className={statusTone(statement.status)}>{statement.status}</Badge></TableCell>
                    <TableCell><div className="flex justify-end gap-0.5"><Button variant="ghost" size="icon-sm" onClick={() => setDetailsId(statement.id)} aria-label="View statement"><Eye className="h-4 w-4" /></Button>{roleAccess.canDelete() && statement.status === "Open" && <Button variant="ghost" size="icon-sm" onClick={() => remove(statement)} aria-label="Delete statement"><Trash2 className="h-4 w-4 text-rose-500" /></Button>}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "كشف" : `statement${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Dialog open={showImport} onOpenChange={(open) => !open && setShowImport(false)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{isRTL ? "استيراد كشف بنكي" : "Import bank statement"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{isRTL ? "الحساب البنكي" : "Bank account"} *</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger aria-label={isRTL ? "الحساب البنكي" : "Bank account"}><SelectValue placeholder={isRTL ? "اختر الحساب" : "Select account"} /></SelectTrigger>
                  <SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.accountCode} — {account.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{isRTL ? "اسم الكشف" : "Statement name"} *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} aria-label={isRTL ? "اسم الكشف" : "Statement name"} />
              </div>
              <div className="space-y-1.5">
                <Label>{isRTL ? "من تاريخ" : "Period start"}</Label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} aria-label={isRTL ? "من تاريخ" : "Period start"} />
              </div>
              <div className="space-y-1.5">
                <Label>{isRTL ? "إلى تاريخ" : "Period end"}</Label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} aria-label={isRTL ? "إلى تاريخ" : "Period end"} />
              </div>
              <div className="space-y-1.5">
                <Label>{isRTL ? "الرصيد الافتتاحي" : "Opening balance"}</Label>
                <Input type="number" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(Number(e.target.value) || 0)} aria-label={isRTL ? "الرصيد الافتتاحي" : "Opening balance"} />
              </div>
              <div className="space-y-1.5">
                <Label>{isRTL ? "الرصيد الختامي" : "Closing balance"}</Label>
                <Input type="number" step="0.01" value={closingBalance} onChange={(e) => setClosingBalance(Number(e.target.value) || 0)} aria-label={isRTL ? "الرصيد الختامي" : "Closing balance"} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "ملف CSV" : "CSV file"} *</Label>
              <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm file:me-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-2 file:py-1 file:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:file:bg-brand-950" aria-label={isRTL ? "ملف CSV" : "CSV file"} />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRTL
                  ? "الأعمدة: date, description, reference, debit, credit"
                  : "Columns: date, description, reference, debit, credit"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImport(false)}>{isRTL ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={submitImport} loading={importMutation.isPending}>{isRTL ? "استيراد" : "Import"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetailsId(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader><DialogTitle>{details?.name} — {details?.accountName}</DialogTitle></DialogHeader>
          {details && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                <div><p className="text-xs text-slate-400">{isRTL ? "الحالة" : "Status"}</p><Badge className={statusTone(details.status)}>{details.status}</Badge></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "الافتتاحي" : "Opening"}</p><p className="font-medium">{formatCurrency(details.openingBalance)}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "الختامي" : "Closing"}</p><p className="font-medium">{formatCurrency(details.closingBalance)}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "الفرق" : "Difference"}</p><p className="font-medium">{formatCurrency(details.statementDifference)}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "المطابقة" : "Matched"}</p><p className="font-medium">{details.matchedCount}/{details.lineCount}</p></div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr><th className="px-3 py-2 text-start">{isRTL ? "التاريخ" : "Date"}</th><th className="px-3 py-2 text-start">{isRTL ? "الوصف" : "Description"}</th><th className="px-3 py-2 text-end">{isRTL ? "مدين" : "Debit"}</th><th className="px-3 py-2 text-end">{isRTL ? "دائن" : "Credit"}</th><th className="px-3 py-2 text-center">{isRTL ? "الحالة" : "Status"}</th><th className="px-3 py-2 text-end">{isRTL ? "إجراءات" : "Actions"}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.lines.map((line) => (
                      <tr key={line.id}>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{new Date(line.date).toLocaleDateString()}</td>
                        <td className="max-w-[240px] truncate px-3 py-2">{line.description}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{line.debit ? formatCurrency(line.debit) : "-"}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{line.credit ? formatCurrency(line.credit) : "-"}</td>
                        <td className="px-3 py-2 text-center"><Badge className={statusTone(line.status)}>{line.status}</Badge></td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            {details.status === "Open" && line.status === "Unmatched" && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => openMatch(details, line)}>{isRTL ? "مطابقة" : "Match"}</Button>
                                <Button variant="ghost" size="sm" onClick={() => ignore(details, line)}>{isRTL ? "تجاهل" : "Ignore"}</Button>
                                <Button variant="ghost" size="sm" onClick={() => adjustment(details, line)}>{isRTL ? "تسوية" : "Adjust"}</Button>
                              </>
                            )}
                            {details.status === "Open" && line.status === "Ignored" && <Button variant="ghost" size="sm" onClick={() => ignore(details, line)}>{isRTL ? "إلغاء التجاهل" : "Unignore"}</Button>}
                            {details.status === "Open" && line.status === "Matched" && <Button variant="ghost" size="sm" onClick={() => unmatch(details, line)}>{isRTL ? "إلغاء المطابقة" : "Unmatch"}</Button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {matchLine && (
                <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3 dark:border-brand-900 dark:bg-brand-950/20">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{isRTL ? "مرشحو المطابقة" : "Matching candidates"} — {matchLine.description}</p>
                    <Button variant="ghost" size="icon-sm" onClick={() => { setMatchLine(null); setCandidates([]); }} aria-label="Close candidates"><X className="h-4 w-4" /></Button>
                  </div>
                  {candidatesLoading ? (
                    <p className="text-sm text-slate-500">{isRTL ? "جارٍ البحث..." : "Searching..."}</p>
                  ) : candidates.length === 0 ? (
                    <p className="text-sm text-slate-500">{isRTL ? "لا توجد قيود بنفس المبلغ والتاريخ." : "No transactions with the same amount and date range."}</p>
                  ) : (
                    <div className="space-y-2">
                      {candidates.map((candidate) => (
                        <div key={candidate.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm dark:bg-slate-900">
                          <div className="min-w-0"><p className="truncate font-medium">{candidate.description || candidate.type || "Transaction"}</p><p className="text-xs text-slate-500">{new Date(candidate.date).toLocaleDateString()} · {candidate.direction}</p></div>
                          <div className="flex items-center gap-3"><span className="font-semibold tabular-nums">{formatCurrency(candidate.amount)}</span><Button size="sm" onClick={() => match(details, candidate)}>{isRTL ? "ربط" : "Link"}</Button></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-wrap">
            <Button variant="outline" onClick={() => setDetailsId(null)}>{isRTL ? "إغلاق" : "Close"}</Button>
            {roleAccess.canEdit() && details?.status === "Open" && details.unmatchedCount === 0 && <Button onClick={() => reconcile(details)} loading={reconcileMutation.isPending}><CheckCircle2 className="h-4 w-4" />{isRTL ? "إغلاق الكشف" : "Reconcile"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankReconciliation;
