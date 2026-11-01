import React, { useEffect, useState } from "react";
import {
  BadgePercent,
  CheckCircle2,
  DollarSign,
  Plus,
  Search,
  Trash2,
  Wallet,
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
import {
  useApproveCommission,
  useCancelCommission,
  useCommissionRules,
  useCommissions,
  useCreateCommissionRule,
  useDeleteCommissionRule,
  useGenerateCommission,
  usePayCommission,
} from "@/hooks/useCommissions";
import { useInvoices } from "@/hooks/useInvoices";
import { useUsers } from "@/hooks/useUsers";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { CommissionRuleDto, SalesCommissionDto } from "@/types/api";

const statusTone = (status: string) => {
  switch (status) {
    case "Paid":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Approved":
      return "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
    case "Cancelled":
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }
};

const Commissions: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [showRule, setShowRule] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRuleDto | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateInvoiceId, setGenerateInvoiceId] = useState("");
  const [generateRuleId, setGenerateRuleId] = useState("");
  const [generateNotes, setGenerateNotes] = useState("");
  const [ruleName, setRuleName] = useState("");
  const [ruleUserId, setRuleUserId] = useState("");
  const [ruleRate, setRuleRate] = useState(5);
  const [ruleBasis, setRuleBasis] = useState("Collected");
  const [ruleFrom, setRuleFrom] = useState(new Date().toISOString().slice(0, 10));
  const [ruleTo, setRuleTo] = useState("");
  const [ruleActive, setRuleActive] = useState(true);

  const { data: rulesResponse, refetch: refetchRules } = useCommissionRules();
  const { data: response, isLoading, refetch } = useCommissions(pagination, {
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const { data: invoiceResponse } = useInvoices({ pageNumber: 1, pageSize: 200 }, { invoiceType: "Sell" });
  const { data: usersResponse } = useUsers({ pageNumber: 1, pageSize: 200 });
  const createRuleMutation = useCreateCommissionRule();
  const deleteRuleMutation = useDeleteCommissionRule();
  const generateMutation = useGenerateCommission();
  const approveMutation = useApproveCommission();
  const payMutation = usePayCommission();
  const cancelMutation = useCancelCommission();

  const rules = rulesResponse?.success ? rulesResponse.data || [] : [];
  const commissions = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;
  const invoices = invoiceResponse?.success ? invoiceResponse.data?.data || [] : [];
  const payableInvoices = invoices.filter((invoice: any) => (invoice.amountPaid || 0) > 0);
  const users = usersResponse?.success ? usersResponse.data?.data || [] : [];

  useEffect(() => {
    if (!showRule) return;
    setRuleName(editingRule?.name || "");
    setRuleUserId(editingRule?.userId || "");
    setRuleRate(editingRule ? editingRule.rate * 100 : 5);
    setRuleBasis(editingRule?.basis || "Collected");
    setRuleFrom((editingRule?.effectiveFrom || new Date().toISOString()).slice(0, 10));
    setRuleTo(editingRule?.effectiveTo ? editingRule.effectiveTo.slice(0, 10) : "");
    setRuleActive(editingRule?.isActive ?? true);
  }, [showRule, editingRule]);

  const openRule = (rule?: CommissionRuleDto) => {
    setEditingRule(rule || null);
    setShowRule(true);
  };

  const saveRule = async () => {
    if (!ruleName.trim()) {
      toast.error(isRTL ? "أدخل اسم القاعدة" : "Enter a rule name");
      return;
    }
    try {
      await createRuleMutation.mutateAsync({
        name: ruleName.trim(),
        userId: ruleUserId || undefined,
        rate: ruleRate / 100,
        basis: ruleBasis,
        isActive: ruleActive,
        effectiveFrom: ruleFrom,
        effectiveTo: ruleTo || undefined,
      });
      toast.success(isRTL ? "تم حفظ القاعدة" : "Commission rule saved");
      setShowRule(false);
      refetchRules();
    } catch (error: any) {
      toast.error(error?.message || "Could not save rule");
    }
  };

  const removeRule = async (rule: CommissionRuleDto) => {
    try {
      await deleteRuleMutation.mutateAsync(rule.id);
      toast.success(isRTL ? "تم حذف القاعدة" : "Rule deleted");
      refetchRules();
    } catch (error: any) {
      toast.error(error?.message || "Could not delete rule");
    }
  };

  const generate = async () => {
    if (!generateInvoiceId) {
      toast.error(isRTL ? "اختر الفاتورة" : "Choose an invoice");
      return;
    }
    try {
      await generateMutation.mutateAsync({
        invoiceId: generateInvoiceId,
        ruleId: generateRuleId || undefined,
        notes: generateNotes,
      });
      toast.success(isRTL ? "تم إنشاء العمولة" : "Commission generated");
      setShowGenerate(false);
      setGenerateInvoiceId("");
      setGenerateRuleId("");
      setGenerateNotes("");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not generate commission");
    }
  };

  const act = async (action: "approve" | "pay" | "cancel", commission: SalesCommissionDto) => {
    try {
      if (action === "approve") await approveMutation.mutateAsync(commission.id);
      if (action === "pay") await payMutation.mutateAsync(commission.id);
      if (action === "cancel") await cancelMutation.mutateAsync(commission.id);
      toast.success(isRTL ? "تم تحديث العمولة" : "Commission updated");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not update commission");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "المبيعات" : "Sales"}
        title={isRTL ? "عمولات المبيعات" : "Sales commissions"}
        description={
          isRTL
            ? "قواعد عمولة حسب مندوب المبيعات، مع اعتماد ودفع وترحيل محاسبي."
            : "Commission rules per salesperson, with approval, payment and ledger posting."
        }
        actions={
          roleAccess.canCreate() ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowGenerate(true)}><DollarSign className="h-4 w-4" />{isRTL ? "احتساب عمولة" : "Generate commission"}</Button>
              <Button onClick={() => openRule()}><Plus className="h-4 w-4" />{isRTL ? "قاعدة جديدة" : "New rule"}</Button>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "عمولات معلّقة" : "Pending"} value={stats.pending || 0} subtitle={isRTL ? "بانتظار الاعتماد" : "Awaiting approval"} icon={BadgePercent} tone="warning" />
        <StatCard title={isRTL ? "معتمدة" : "Approved"} value={stats.approved || 0} subtitle={isRTL ? "جاهزة للدفع" : "Ready to pay"} icon={CheckCircle2} tone="info" />
        <StatCard title={isRTL ? "مدفوعة" : "Paid"} value={stats.paid || 0} subtitle={isRTL ? "تم ترحيلها" : "Posted to ledger"} icon={Wallet} tone="success" />
        <StatCard title={isRTL ? "قيمة المعلّق" : "Pending value"} value={formatCurrency(stats.pendingValue || 0)} subtitle={isRTL ? "مبالغ بانتظار الاعتماد" : "Awaiting approval value"} icon={DollarSign} tone="brand" />
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageNumber: 1 })); }} placeholder={isRTL ? "ابحث بالفاتورة أو القاعدة..." : "Search invoice or rule..."} className="ps-9" />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="Pending">{isRTL ? "معلّقة" : "Pending"}</SelectItem>
              <SelectItem value="Approved">{isRTL ? "معتمدة" : "Approved"}</SelectItem>
              <SelectItem value="Paid">{isRTL ? "مدفوعة" : "Paid"}</SelectItem>
              <SelectItem value="Cancelled">{isRTL ? "ملغاة" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{isRTL ? "جارٍ التحميل..." : "Loading commissions..."}</CardContent>
        ) : commissions.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"><BadgePercent className="h-7 w-7" /></div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isRTL ? "لا توجد عمولات" : "No commissions yet"}</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{isRTL ? "أضف قاعدة عمولة ثم احتسبها من فاتورة محصلة." : "Add a rule, then generate a commission from a collected invoice."}</p>
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>{isRTL ? "الفاتورة" : "Invoice"}</TableHead><TableHead>{isRTL ? "القاعدة" : "Rule"}</TableHead><TableHead>{isRTL ? "المندوب" : "Salesperson"}</TableHead><TableHead>{isRTL ? "الأساس" : "Basis"}</TableHead><TableHead>{isRTL ? "العمولة" : "Commission"}</TableHead><TableHead>{isRTL ? "الحالة" : "Status"}</TableHead><TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead></TableRow></TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white">{commission.invoiceNumber}<span className="block text-xs font-normal text-slate-500">{commission.customerName}</span></TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{commission.ruleName}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{commission.userName || "-"}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{formatCurrency(commission.basisAmount)} · {(commission.rate * 100).toFixed(1)}%</TableCell>
                    <TableCell className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(commission.amount)}</TableCell>
                    <TableCell><Badge className={statusTone(commission.status)}>{commission.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {roleAccess.isAdmin() && commission.status === "Pending" && <Button size="sm" variant="outline" onClick={() => act("approve", commission)}>{isRTL ? "اعتماد" : "Approve"}</Button>}
                        {roleAccess.isAdmin() && commission.status === "Approved" && <Button size="sm" onClick={() => act("pay", commission)}>{isRTL ? "دفع" : "Pay"}</Button>}
                        {roleAccess.isAdmin() && ["Pending", "Approved"].includes(commission.status) && <Button size="sm" variant="ghost" onClick={() => act("cancel", commission)}>{isRTL ? "إلغاء" : "Cancel"}</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "عمولة" : `commission${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isRTL ? "قواعد العمولة" : "Commission rules"}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? "نسبة لكل مندوب أو قاعدة عامة." : "Per-salesperson or global rates."}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => openRule()}><Plus className="h-4 w-4" />{isRTL ? "قاعدة" : "Rule"}</Button>
        </CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>{isRTL ? "القاعدة" : "Rule"}</TableHead><TableHead>{isRTL ? "المندوب" : "Salesperson"}</TableHead><TableHead>{isRTL ? "النسبة" : "Rate"}</TableHead><TableHead>{isRTL ? "الأساس" : "Basis"}</TableHead><TableHead>{isRTL ? "الصلاحية" : "Effective"}</TableHead><TableHead>{isRTL ? "الحالة" : "Status"}</TableHead><TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead></TableRow></TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium text-slate-900 dark:text-white">{rule.name}</TableCell>
                <TableCell className="text-slate-500 dark:text-slate-400">{rule.userName || (isRTL ? "عام" : "Global")}</TableCell>
                <TableCell className="tabular-nums text-slate-700 dark:text-slate-300">{(rule.rate * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-slate-500 dark:text-slate-400">{rule.basis}</TableCell>
                <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(rule.effectiveFrom).toLocaleDateString()}{rule.effectiveTo ? ` — ${new Date(rule.effectiveTo).toLocaleDateString()}` : ""}</TableCell>
                <TableCell><Badge className={rule.isActive ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-slate-200 bg-slate-50 text-slate-600"}>{rule.isActive ? (isRTL ? "نشطة" : "Active") : (isRTL ? "غير نشطة" : "Inactive")}</Badge></TableCell>
                <TableCell><div className="flex justify-end gap-0.5">{roleAccess.canDelete() && <Button variant="ghost" size="icon-sm" onClick={() => removeRule(rule)} aria-label="Delete rule"><Trash2 className="h-4 w-4 text-rose-500" /></Button>}</div></TableCell>
              </TableRow>
            ))}
            {rules.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">{isRTL ? "لا توجد قواعد بعد." : "No commission rules yet."}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showRule} onOpenChange={setShowRule}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{editingRule ? (isRTL ? "تعديل القاعدة" : "Edit rule") : (isRTL ? "قاعدة عمولة جديدة" : "New commission rule")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>{isRTL ? "الاسم" : "Name"} *</Label><Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} aria-label={isRTL ? "الاسم" : "Name"} /></div>
              <div className="space-y-1.5"><Label>{isRTL ? "المندوب" : "Salesperson"}</Label><Select value={ruleUserId || "global"} onValueChange={(value) => setRuleUserId(value === "global" ? "" : value)}><SelectTrigger aria-label={isRTL ? "المندوب" : "Salesperson"}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="global">{isRTL ? "عام" : "Global"}</SelectItem>{users.map((user: any) => <SelectItem key={user.id} value={user.id}>{user.firstName} {user.lastName}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>{isRTL ? "النسبة %" : "Rate %"}</Label><Input type="number" min={0.01} max={100} step="0.01" value={ruleRate} onChange={(e) => setRuleRate(Number(e.target.value) || 0)} aria-label={isRTL ? "النسبة" : "Rate"} /></div>
              <div className="space-y-1.5"><Label>{isRTL ? "الأساس" : "Basis"}</Label><Select value={ruleBasis} onValueChange={setRuleBasis}><SelectTrigger aria-label={isRTL ? "الأساس" : "Basis"}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Collected">{isRTL ? "المحصّل" : "Collected"}</SelectItem><SelectItem value="Invoiced">{isRTL ? "الفاتورة" : "Invoiced"}</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>{isRTL ? "تبدأ" : "Effective from"}</Label><Input type="date" value={ruleFrom} onChange={(e) => setRuleFrom(e.target.value)} aria-label={isRTL ? "تبدأ" : "Effective from"} /></div>
              <div className="space-y-1.5"><Label>{isRTL ? "تنتهي" : "Effective to"}</Label><Input type="date" value={ruleTo} onChange={(e) => setRuleTo(e.target.value)} aria-label={isRTL ? "تنتهي" : "Effective to"} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={ruleActive} onChange={(e) => setRuleActive(e.target.checked)} />{isRTL ? "نشطة" : "Active"}</label>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowRule(false)}>{isRTL ? "إلغاء" : "Cancel"}</Button><Button onClick={saveRule} loading={createRuleMutation.isPending}>{isRTL ? "حفظ" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{isRTL ? "احتساب عمولة" : "Generate commission"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>{isRTL ? "الفاتورة المحصلة" : "Collected invoice"} *</Label><Select value={generateInvoiceId} onValueChange={setGenerateInvoiceId}><SelectTrigger aria-label={isRTL ? "الفاتورة" : "Invoice"}><SelectValue placeholder={isRTL ? "اختر الفاتورة" : "Choose invoice"} /></SelectTrigger><SelectContent>{payableInvoices.map((invoice: any) => <SelectItem key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} — {invoice.customerName} ({formatCurrency(invoice.amountPaid || 0)} {isRTL ? "محصل" : "collected"})</SelectItem>)}</SelectContent></Select>{payableInvoices.length === 0 && <p className="text-xs text-slate-500">{isRTL ? "لا توجد فواتير محصلة." : "No collected invoices available."}</p>}</div>
            <div className="space-y-1.5"><Label>{isRTL ? "القاعدة" : "Rule"}</Label><Select value={generateRuleId || "auto"} onValueChange={(value) => setGenerateRuleId(value === "auto" ? "" : value)}><SelectTrigger aria-label={isRTL ? "القاعدة" : "Rule"}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">{isRTL ? "تلقائي" : "Automatic"}</SelectItem>{rules.filter((rule) => rule.isActive).map((rule) => <SelectItem key={rule.id} value={rule.id}>{rule.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>{isRTL ? "ملاحظات" : "Notes"}</Label><Input value={generateNotes} onChange={(e) => setGenerateNotes(e.target.value)} aria-label={isRTL ? "ملاحظات" : "Notes"} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowGenerate(false)}>{isRTL ? "إلغاء" : "Cancel"}</Button><Button onClick={generate} loading={generateMutation.isPending}>{isRTL ? "احتساب" : "Generate"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Commissions;
