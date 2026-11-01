import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Wallet,
  TrendingUp,
  Users,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
} from "lucide-react";
import { toast } from "react-toastify";
import { formatCurrency } from "@/Helpers/formatCurrency";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import {
  stakeholderService,
  StakeholderDto,
  StakeholderInput,
  StakeholderTransactionDto,
  StakeholderTransactionInput,
  StakeholderTransactionType,
  StakeholderType,
} from "@/services/stakeholderService";

const emptyForm: StakeholderInput = {
  name: "",
  type: "Shareholder",
  email: "",
  phone: "",
  ownershipPercent: 0,
  notes: "",
  isActive: true,
};

const transactionLabels: Record<StakeholderTransactionType, string> = {
  CapitalContribution: "Capital contribution",
  Dividend: "Dividend / distribution",
  LoanReceived: "Loan received",
  LoanRepayment: "Loan repayment",
  Withdrawal: "Withdrawal",
};

const Stakeholders = () => {
  const { t, isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const [items, setItems] = useState<StakeholderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<StakeholderDto | null>(null);
  const [form, setForm] = useState<StakeholderInput>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [selected, setSelected] = useState<StakeholderDto | null>(null);
  const [transactions, setTransactions] = useState<StakeholderTransactionDto[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
  const [transactionForm, setTransactionForm] =
    useState<StakeholderTransactionInput>({
      type: "CapitalContribution",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      reference: "",
      description: "",
    });

  const load = async () => {
    setIsLoading(true);
    const result = await stakeholderService.getAll();
    if (result.success) {
      setItems(result.data || []);
    } else {
      toast.error(result.errorMessage || "Failed to load stakeholders.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          capital: acc.capital + item.capitalBalance,
          loans: acc.loans + item.loanBalance,
          ownership: acc.ownership + item.ownershipPercent,
        }),
        { capital: 0, loans: 0, ownership: 0 }
      ),
    [items]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (item: StakeholderDto) => {
    setEditing(item);
    setForm({
      name: item.name,
      type: item.type,
      email: item.email || "",
      phone: item.phone || "",
      ownershipPercent: item.ownershipPercent,
      accountId: item.accountId,
      notes: item.notes || "",
      isActive: item.isActive,
    });
    setIsFormOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Stakeholder name is required.");
      return;
    }
    if (form.ownershipPercent < 0 || form.ownershipPercent > 100) {
      toast.error("Ownership must be between 0 and 100.");
      return;
    }

    setIsSaving(true);
    const result = editing
      ? await stakeholderService.update(editing.id, form)
      : await stakeholderService.create(form);
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.errorMessage || "Failed to save stakeholder.");
      return;
    }

    toast.success(editing ? "Stakeholder updated." : "Stakeholder created.");
    setIsFormOpen(false);
    load();
  };

  const remove = async (item: StakeholderDto) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    const result = await stakeholderService.remove(item.id);
    if (!result.success) {
      toast.error(result.errorMessage || "Failed to delete stakeholder.");
      return;
    }
    toast.success("Stakeholder deleted.");
    load();
  };

  const exportStatement = async (item: StakeholderDto) => {
    try {
      const blob = await stakeholderService.exportStatement(item.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `stakeholder-statement-${item.name.replace(/\s+/g, "-")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.message || "Failed to export statement.");
    }
  };

  const openTransactions = async (item: StakeholderDto) => {
    setSelected(item);
    setIsTransactionsLoading(true);
    const result = await stakeholderService.getTransactions(item.id);
    if (result.success) {
      setTransactions(result.data || []);
    } else {
      toast.error(result.errorMessage || "Failed to load transactions.");
      setTransactions([]);
    }
    setIsTransactionsLoading(false);
  };

  const addTransaction = async () => {
    if (!selected) return;
    if (transactionForm.amount <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }

    const result = await stakeholderService.addTransaction(
      selected.id,
      transactionForm
    );
    if (!result.success) {
      toast.error(result.errorMessage || "Failed to record transaction.");
      return;
    }

    toast.success("Transaction recorded and posted to the ledger.");
    setTransactionForm({
      type: "CapitalContribution",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      reference: "",
      description: "",
    });
    await openTransactions(selected);
    load();
  };

  const removeTransaction = async (transaction: StakeholderTransactionDto) => {
    if (!window.confirm("Delete this transaction and post a reversal?")) return;
    const result = await stakeholderService.removeTransaction(transaction.id);
    if (!result.success) {
      toast.error(result.errorMessage || "Failed to delete transaction.");
      return;
    }
    toast.success("Transaction reversed.");
    if (selected) await openTransactions(selected);
    load();
  };

  const statCards = [
    {
      label: "Stakeholders",
      value: String(items.length),
      icon: Users,
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "Capital",
      value: formatCurrency(totals.capital),
      icon: Landmark,
      color: "from-emerald-500 to-teal-600",
    },
    {
      label: "Stakeholder loans",
      value: formatCurrency(totals.loans),
      icon: Wallet,
      color: "from-amber-500 to-orange-600",
    },
    {
      label: "Ownership allocated",
      value: `${totals.ownership.toFixed(2)}%`,
      icon: TrendingUp,
      color: "from-violet-500 to-purple-600",
    },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isRTL ? "أصحاب المصلحة" : "Stakeholders"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isRTL
              ? "إدارة المساهمين والشركاء والمستثمرين وأرصدة رأس المال والقروض."
              : "Manage shareholders, partners and investors, their capital and loans."}
          </p>
        </div>
        {roleAccess.canCreate() && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            {isRTL ? "إضافة صاحب مصلحة" : "Add stakeholder"}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              <div
                className="rounded-lg bg-brand-50 p-2 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
              >
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {isRTL ? "سجل أصحاب المصلحة" : "Stakeholder register"}
          </h2>
          <span className="text-xs text-slate-500">
            {items.length} {isRTL ? "سجل" : "records"}
          </span>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading stakeholders...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700 dark:text-slate-200">
              {isRTL ? "لا يوجد أصحاب مصلحة بعد" : "No stakeholders yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {isRTL
                ? "أضف أول مساهم أو شريك لبدء تتبع رأس المال."
                : "Add your first shareholder or partner to start tracking capital."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-end">Ownership</th>
                  <th className="px-5 py-3 text-end">Capital</th>
                  <th className="px-5 py-3 text-end">Loans</th>
                  <th className="px-5 py-3 text-end">Net position</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.email || item.phone || item.accountName || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {item.type}
                    </td>
                    <td className="px-5 py-4 text-end font-medium">
                      {item.ownershipPercent.toFixed(2)}%
                    </td>
                    <td className="px-5 py-4 text-end">
                      {formatCurrency(item.capitalBalance)}
                    </td>
                    <td className="px-5 py-4 text-end">
                      {formatCurrency(item.loanBalance)}
                    </td>
                    <td className="px-5 py-4 text-end font-semibold">
                      {formatCurrency(item.netPosition)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.isActive
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => exportStatement(item)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30"
                          title="Export statement"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openTransactions(item)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30"
                          title="Transactions"
                        >
                          <Wallet className="h-4 w-4" />
                        </button>
                        {roleAccess.canEdit() && (
                          <button
                            onClick={() => openEdit(item)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {roleAccess.canDelete() && (
                          <button
                            onClick={() => remove(item)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <Modal onClose={() => setIsFormOpen(false)} title={editing ? "Edit stakeholder" : "New stakeholder"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="e.g. Ahmed Nasser"
              />
            </Field>
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as StakeholderType })
                }
                className="input"
              >
                <option value="Shareholder">Shareholder</option>
                <option value="Partner">Partner</option>
                <option value="Investor">Investor</option>
              </select>
            </Field>
            <Field label="Email">
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                type="email"
              />
            </Field>
            <Field label="Phone">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Ownership %">
              <input
                value={form.ownershipPercent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    ownershipPercent: Number(e.target.value) || 0,
                  })
                }
                className="input"
                type="number"
                min={0}
                max={100}
                step="0.01"
              />
            </Field>
            <Field label="Status">
              <select
                value={form.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.value === "active" })
                }
                className="input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input min-h-24"
                />
              </Field>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsFormOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={isSaving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal
          onClose={() => setSelected(null)}
          title={`${selected.name} — transactions`}
          wide
        >
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                History
              </h4>
              {isTransactionsLoading ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : transactions.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">
                  No transactions yet.
                </p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {transactions.map((transaction) => {
                    const isInflow = [
                      "CapitalContribution",
                      "LoanReceived",
                    ].includes(transaction.type);
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-lg p-2 ${
                              isInflow
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30"
                                : "bg-amber-50 text-amber-600 dark:bg-amber-900/30"
                            }`}
                          >
                            {isInflow ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {transactionLabels[transaction.type]}
                            </p>
                            <p className="text-xs text-slate-500">
                              {transaction.date}
                              {transaction.reference
                                ? ` · ${transaction.reference}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-sm font-semibold ${
                              isInflow ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isInflow ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </span>
                          {roleAccess.canDelete() && (
                            <button
                              onClick={() => removeTransaction(transaction)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Record transaction
              </h4>
              <div className="space-y-3">
                <select
                  value={transactionForm.type}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      type: e.target.value as StakeholderTransactionType,
                    })
                  }
                  className="input"
                >
                  <option value="CapitalContribution">Capital contribution</option>
                  <option value="Dividend">Dividend / distribution</option>
                  <option value="LoanReceived">Loan received</option>
                  <option value="LoanRepayment">Loan repayment</option>
                  <option value="Withdrawal">Withdrawal</option>
                </select>
                <input
                  value={transactionForm.amount || ""}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      amount: Number(e.target.value) || 0,
                    })
                  }
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Amount"
                />
                <input
                  value={transactionForm.date}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      date: e.target.value,
                    })
                  }
                  className="input"
                  type="date"
                />
                <input
                  value={transactionForm.reference}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      reference: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="Reference (optional)"
                />
                <textarea
                  value={transactionForm.description}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      description: e.target.value,
                    })
                  }
                  className="input min-h-20"
                  placeholder="Description"
                />
                <button
                  onClick={addTransaction}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700"
                >
                  Post transaction
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </span>
    {children}
  </label>
);

const Modal = ({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
    <div
      className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-900 ${
        wide ? "max-w-4xl" : "max-w-2xl"
      }`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default Stakeholders;
