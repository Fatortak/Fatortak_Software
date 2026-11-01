import React, { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Eye,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
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
import {
  useApprovalCandidates,
  useApprovalPolicies,
  useApprovals,
  useApproveRequest,
  useCancelApproval,
  useCreateApproval,
  useRejectRequest,
  useSaveApprovalPolicy,
} from "@/hooks/useApprovals";
import { formatCurrency } from "@/Helpers/formatCurrency";
import type { ApprovalPolicyDto, ApprovalRequestDto } from "@/types/api";

const documentTypes = [
  "Invoice",
  "Quotation",
  "PurchaseOrder",
  "Expense",
  "CreditNote",
  "Payment",
  "Discount",
];

const statusTone = (status: string) => {
  switch (status) {
    case "Approved":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Rejected":
      return "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300";
    case "Cancelled":
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }
};

const Approvals: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [documentType, setDocumentType] = useState("all");
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10 });
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState("PurchaseOrder");
  const [candidateId, setCandidateId] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [details, setDetails] = useState<ApprovalRequestDto | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [policyRows, setPolicyRows] = useState<ApprovalPolicyDto[]>([]);

  const { data: response, isLoading, refetch } = useApprovals(pagination, {
    search: search || undefined,
    status: status === "all" ? undefined : status,
    documentType: documentType === "all" ? undefined : documentType,
  });
  const { data: candidateResponse } = useApprovalCandidates(createType);
  const { data: policyResponse } = useApprovalPolicies();
  const createMutation = useCreateApproval();
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();
  const cancelMutation = useCancelApproval();
  const savePolicyMutation = useSaveApprovalPolicy();

  const requests = response?.success ? response.data?.data || [] : [];
  const stats: any = response?.success ? response.data?.metaData || {} : {};
  const totalCount = response?.success ? response.data?.totalCount || 0 : 0;
  const candidates = candidateResponse?.success ? candidateResponse.data || [] : [];

  useEffect(() => {
    if (policyResponse?.success) setPolicyRows(policyResponse.data || []);
  }, [policyResponse]);

  const refreshDetails = async () => {
    const result = await refetch();
    if (details && result.data?.success) {
      const fresh = result.data.data?.data?.find((r) => r.id === details.id);
      setDetails(fresh || null);
    }
  };

  const openCreate = () => {
    setCreateType("PurchaseOrder");
    setCandidateId("");
    setCreateNotes("");
    setShowCreate(true);
  };

  const submitCreate = async () => {
    if (!candidateId) {
      toast.error(isRTL ? "اختر المستند" : "Choose a document");
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        documentType: createType,
        documentId: candidateId,
        notes: createNotes,
      });
      if (result.data?.status === "Approved") {
        toast.success(
          isRTL
            ? "تم اعتماد الطلب تلقائياً وفق حد الاعتماد"
            : "Auto-approved under the configured threshold"
        );
      } else {
        toast.success(isRTL ? "تم إرسال الطلب للاعتماد" : "Sent for approval");
      }
      setShowCreate(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not create approval request");
    }
  };

  const approve = async (request: ApprovalRequestDto) => {
    try {
      await approveMutation.mutateAsync({ id: request.id, data: { notes: decisionNotes } });
      toast.success(isRTL ? "تم الاعتماد" : "Request approved");
      setDecisionNotes("");
      await refreshDetails();
    } catch (error: any) {
      toast.error(error?.message || "Could not approve request");
    }
  };

  const reject = async (request: ApprovalRequestDto) => {
    if (!decisionNotes.trim()) {
      toast.error(isRTL ? "أدخل سبب الرفض" : "Enter a rejection reason");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id: request.id, data: { notes: decisionNotes } });
      toast.success(isRTL ? "تم الرفض" : "Request rejected");
      setDecisionNotes("");
      await refreshDetails();
    } catch (error: any) {
      toast.error(error?.message || "Could not reject request");
    }
  };

  const cancel = async (request: ApprovalRequestDto) => {
    try {
      await cancelMutation.mutateAsync(request.id);
      toast.success(isRTL ? "تم إلغاء الطلب" : "Request cancelled");
      await refreshDetails();
    } catch (error: any) {
      toast.error(error?.message || "Could not cancel request");
    }
  };

  const savePolicies = async () => {
    try {
      for (const policy of policyRows) {
        await savePolicyMutation.mutateAsync(policy);
      }
      toast.success(isRTL ? "تم حفظ سياسات الاعتماد" : "Approval policies saved");
      setPoliciesOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Could not save policies");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "الحوكمة" : "Governance"}
        title={isRTL ? "قائمة الاعتماد" : "Approval queue"}
        description={
          isRTL
            ? "أرسل المستندات للاعتماد، راجعها، ثم اعتمدها أو ارفضها مع أثر واضح."
            : "Submit documents for approval, review them, then approve or reject with a clear audit trail."
        }
        actions={
          roleAccess.canCreate() ? (
            <div className="flex flex-wrap gap-2">
              {roleAccess.isAdmin() && (
                <Button variant="outline" onClick={() => setPoliciesOpen(true)}>
                  <Settings2 className="h-4 w-4" />
                  {isRTL ? "السياسات" : "Policies"}
                </Button>
              )}
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {isRTL ? "طلب اعتماد" : "New request"}
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "بانتظار الاعتماد" : "Pending"} value={stats.pending || 0} subtitle={isRTL ? "تحتاج قراراً" : "Awaiting decision"} icon={ShieldCheck} tone="warning" />
        <StatCard title={isRTL ? "معتمدة" : "Approved"} value={stats.approved || 0} subtitle={isRTL ? "تم اعتمادها" : "Approved requests"} icon={CheckCircle2} tone="success" />
        <StatCard title={isRTL ? "مرفوضة" : "Rejected"} value={stats.rejected || 0} subtitle={isRTL ? "تم رفضها" : "Rejected requests"} icon={X} tone="danger" />
        <StatCard title={isRTL ? "قيمة المعلّق" : "Pending value"} value={formatCurrency(stats.pendingValue || 0)} subtitle={isRTL ? "إجمالي المبالغ" : "Total blocked value"} icon={ShieldCheck} tone="brand" />
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}
              placeholder={isRTL ? "ابحث برقم المستند..." : "Search document number..."}
              className="ps-9"
            />
          </div>
          <Select value={documentType} onValueChange={(value) => { setDocumentType(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
            <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الأنواع" : "All types"}</SelectItem>
              {documentTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPagination((p) => ({ ...p, pageNumber: 1 })); }}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="Pending">{isRTL ? "معلّق" : "Pending"}</SelectItem>
              <SelectItem value="Approved">{isRTL ? "معتمد" : "Approved"}</SelectItem>
              <SelectItem value="Rejected">{isRTL ? "مرفوض" : "Rejected"}</SelectItem>
              <SelectItem value="Cancelled">{isRTL ? "ملغي" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{isRTL ? "جارٍ التحميل..." : "Loading approval queue..."}</CardContent>
        ) : requests.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"><ShieldCheck className="h-7 w-7" /></div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isRTL ? "قائمة الاعتماد فارغة" : "No approval requests"}</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{isRTL ? "أرسل مستنداً للاعتماد وابدأ دورة المراجعة." : "Submit a document to start the review cycle."}</p>
            {roleAccess.canCreate() && <Button className="mt-5" onClick={openCreate}><Plus className="h-4 w-4" />{isRTL ? "طلب اعتماد" : "New request"}</Button>}
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "المستند" : "Document"}</TableHead>
                  <TableHead>{isRTL ? "النوع" : "Type"}</TableHead>
                  <TableHead>{isRTL ? "القيمة" : "Amount"}</TableHead>
                  <TableHead>{isRTL ? "مقدم الطلب" : "Requested by"}</TableHead>
                  <TableHead>{isRTL ? "التاريخ" : "Requested"}</TableHead>
                  <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      <button className="hover:text-brand-600" onClick={() => { setDetails(request); setDecisionNotes(""); }}>{request.documentNumber}</button>
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{request.documentType}</TableCell>
                    <TableCell className="whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(request.amount)}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{request.requestedByName || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                    <TableCell><Badge className={statusTone(request.status)}>{request.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon-sm" onClick={() => { setDetails(request); setDecisionNotes(""); }} aria-label="View request"><Eye className="h-4 w-4" /></Button>
                        {roleAccess.isAdmin() && request.status === "Pending" && (
                          <>
                            <Button variant="ghost" size="icon-sm" onClick={() => approve(request)} aria-label="Approve request"><Check className="h-4 w-4 text-emerald-600" /></Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => { setDetails(request); setDecisionNotes(""); }} aria-label="Reject request"><X className="h-4 w-4 text-rose-500" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span>{totalCount} {isRTL ? "طلب" : `request${totalCount === 1 ? "" : "s"}`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.pageNumber <= 1} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber - 1 }))}>{isRTL ? "السابق" : "Previous"}</Button>
                <Button variant="outline" size="sm" disabled={pagination.pageNumber * pagination.pageSize >= totalCount} onClick={() => setPagination((p) => ({ ...p, pageNumber: p.pageNumber + 1 }))}>{isRTL ? "التالي" : "Next"}</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Dialog open={showCreate} onOpenChange={(open) => !open && setShowCreate(false)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-brand-600" />{isRTL ? "طلب اعتماد جديد" : "New approval request"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{isRTL ? "نوع المستند" : "Document type"}</Label>
                <Select value={createType} onValueChange={(value) => { setCreateType(value); setCandidateId(""); }}>
                  <SelectTrigger aria-label={isRTL ? "نوع المستند" : "Document type"}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{isRTL ? "المستند" : "Document"} *</Label>
                <Select value={candidateId} onValueChange={setCandidateId}>
                  <SelectTrigger aria-label={isRTL ? "المستند" : "Document"}><SelectValue placeholder={isRTL ? "اختر المستند" : "Choose document"} /></SelectTrigger>
                  <SelectContent>
                    {candidates.map((candidate) => (
                      <SelectItem key={candidate.documentId} value={candidate.documentId}>
                        {candidate.documentNumber} — {formatCurrency(candidate.amount)}
                        {candidate.partyName ? ` — ${candidate.partyName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{isRTL ? "ملاحظات" : "Notes"}</Label>
              <textarea value={createNotes} onChange={(e) => setCreateNotes(e.target.value)} rows={3} aria-label={isRTL ? "ملاحظات" : "Notes"} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900" />
            </div>
            {candidates.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{isRTL ? "لا توجد مستندات متاحة لهذا النوع." : "No available documents for this type."}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{isRTL ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={submitCreate} loading={createMutation.isPending}>{isRTL ? "إرسال للاعتماد" : "Send for approval"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{details?.documentNumber} — {details?.documentType}</DialogTitle></DialogHeader>
          {details && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-400">{isRTL ? "الحالة" : "Status"}</p><Badge className={statusTone(details.status)}>{details.status}</Badge></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "القيمة" : "Amount"}</p><p className="font-semibold">{formatCurrency(details.amount)}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "مقدم الطلب" : "Requested by"}</p><p className="font-medium">{details.requestedByName || "-"}</p></div>
                <div><p className="text-xs text-slate-400">{isRTL ? "تاريخ الطلب" : "Requested"}</p><p className="font-medium">{new Date(details.requestedAt).toLocaleString()}</p></div>
              </div>
              {details.notes && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{details.notes}</p>}
              {details.decidedAt && <p className="text-xs text-slate-500">{isRTL ? "قرار بواسطة" : "Decided by"} {details.decidedByName} — {new Date(details.decidedAt).toLocaleString()}</p>}
              {details.decisionNotes && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{details.decisionNotes}</p>}
              {details.status === "Pending" && roleAccess.isAdmin() && (
                <div className="space-y-1.5">
                  <Label>{isRTL ? "ملاحظات القرار" : "Decision notes"}</Label>
                  <textarea value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} rows={2} aria-label={isRTL ? "ملاحظات القرار" : "Decision notes"} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900" />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-wrap">
            <Button variant="outline" onClick={() => setDetails(null)}>{isRTL ? "إغلاق" : "Close"}</Button>
            {roleAccess.canEdit() && details?.status === "Pending" && <Button variant="ghost" onClick={() => cancel(details!)}>{isRTL ? "إلغاء الطلب" : "Cancel request"}</Button>}
            {roleAccess.isAdmin() && details?.status === "Pending" && <Button variant="outline" onClick={() => reject(details!)} loading={rejectMutation.isPending}>{isRTL ? "رفض" : "Reject"}</Button>}
            {roleAccess.isAdmin() && details?.status === "Pending" && <Button onClick={() => approve(details!)} loading={approveMutation.isPending}><Check className="h-4 w-4" />{isRTL ? "اعتماد" : "Approve"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={policiesOpen} onOpenChange={setPoliciesOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{isRTL ? "سياسات الاعتماد" : "Approval policies"}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRTL
              ? "عند تعطيل النوع يُعتمد تلقائياً. وعند وجود حد، تُعتمد الطلبات الأقل من الحد تلقائياً."
              : "Disabling a type auto-approves it. When a threshold is set, requests below it are auto-approved."}
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr><th className="px-3 py-2 text-start">{isRTL ? "النوع" : "Type"}</th><th className="px-3 py-2 text-end">{isRTL ? "الحد" : "Threshold"}</th><th className="px-3 py-2 text-center">{isRTL ? "مفعّل" : "Enabled"}</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {policyRows.map((policy, index) => (
                  <tr key={policy.documentType}>
                    <td className="px-3 py-2">{policy.documentType}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={policy.thresholdAmount}
                        onChange={(e) => setPolicyRows((prev) => prev.map((row, i) => i === index ? { ...row, thresholdAmount: Number(e.target.value) || 0 } : row))}
                        className="ms-auto h-8 w-32 px-2 text-end"
                        aria-label={`${policy.documentType} threshold`}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand-600"
                        checked={policy.isEnabled}
                        onChange={(e) => setPolicyRows((prev) => prev.map((row, i) => i === index ? { ...row, isEnabled: e.target.checked } : row))}
                        aria-label={`${policy.documentType} enabled`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPoliciesOpen(false)}>{isRTL ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={savePolicies} loading={savePolicyMutation.isPending}>{isRTL ? "حفظ السياسات" : "Save policies"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Approvals;
