import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calculator,
  ClipboardList,
  FileSpreadsheet,
  FolderKanban,
  Landmark,
  Receipt,
  Scale,
  Search,
  ShieldCheck,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

type ReportGroup = "Financial" | "Receivables" | "Sales" | "Cash" | "Tax";

interface ReportCard {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  group: ReportGroup;
  tone: string;
}

const reports: ReportCard[] = [
  {
    title: "Trial Balance",
    description: "Debit and credit balances for every account, with a live balance check.",
    path: "/reports/trial-balance",
    icon: Scale,
    group: "Financial",
    tone: "from-indigo-500 to-blue-600",
  },
  {
    title: "General Ledger",
    description: "Account-by-account movements with opening and closing balances.",
    path: "/reports/ledger",
    icon: BookOpen,
    group: "Financial",
    tone: "from-sky-500 to-cyan-600",
  },
  {
    title: "Income Statement",
    description: "Revenue, expenses and net profit for a selected period.",
    path: "/reports/income-statement",
    icon: TrendingUp,
    group: "Financial",
    tone: "from-emerald-500 to-teal-600",
  },
  {
    title: "Balance Sheet",
    description: "Assets, liabilities and equity with a balance check.",
    path: "/reports/balance-sheet",
    icon: Landmark,
    group: "Financial",
    tone: "from-violet-500 to-purple-600",
  },
  {
    title: "Cash Flow",
    description: "Operating, investing and financing cash movements.",
    path: "/reports/cash-flow",
    icon: Wallet,
    group: "Cash",
    tone: "from-amber-500 to-orange-600",
  },
  {
    title: "Cash & Bank Movements",
    description: "Movement by cash or bank account for the selected period.",
    path: "/reports/cash-bank-movements",
    icon: BarChart3,
    group: "Cash",
    tone: "from-cyan-500 to-blue-600",
  },
  {
    title: "AR Aging",
    description: "Outstanding customer balances grouped by age.",
    path: "/reports/ar-aging",
    icon: ClipboardList,
    group: "Receivables",
    tone: "from-rose-500 to-pink-600",
  },
  {
    title: "AP Aging",
    description: "Outstanding supplier balances grouped by age.",
    path: "/reports/ap-aging",
    icon: Truck,
    group: "Receivables",
    tone: "from-orange-500 to-red-600",
  },
  {
    title: "Customer Statement",
    description: "Invoices, payments and running balance for one customer.",
    path: "/reports/customer-statement",
    icon: Users,
    group: "Receivables",
    tone: "from-teal-500 to-emerald-600",
  },
  {
    title: "Vendor Statement",
    description: "Purchases, payments and running balance for one supplier.",
    path: "/reports/vendor-statement",
    icon: Receipt,
    group: "Receivables",
    tone: "from-fuchsia-500 to-purple-600",
  },
  {
    title: "Sales Report",
    description: "Sales by customer, with invoice counts and totals.",
    path: "/reports/sales",
    icon: Receipt,
    group: "Sales",
    tone: "from-blue-500 to-indigo-600",
  },
  {
    title: "Project Profitability",
    description: "Revenue, cost and margin for each project.",
    path: "/reports/project-profitability",
    icon: FolderKanban,
    group: "Sales",
    tone: "from-lime-500 to-emerald-600",
  },
  {
    title: "VAT Return & E-Invoices",
    description: "Output/input VAT summary and a JSON e-invoice export pack.",
    path: "/tax-reports",
    icon: ShieldCheck,
    group: "Tax",
    tone: "from-slate-600 to-slate-800",
  },
];

const groups: Array<"All" | ReportGroup> = [
  "All",
  "Financial",
  "Receivables",
  "Sales",
  "Cash",
  "Tax",
];

const groupOrder: ReportGroup[] = [
  "Financial",
  "Receivables",
  "Sales",
  "Cash",
  "Tax",
];

const ReportsHub = () => {
  const { isRTL } = useLanguage();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<(typeof groups)[number]>("All");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesGroup = group === "All" || report.group === group;
      const matchesQuery =
        !term ||
        report.title.toLowerCase().includes(term) ||
        report.description.toLowerCase().includes(term);
      return matchesGroup && matchesQuery;
    });
  }, [group, query]);

  const grouped = useMemo(
    () =>
      groupOrder
        .map((key) => ({
          key,
          items: filtered.filter((report) => report.group === key),
        }))
        .filter((entry) => entry.items.length > 0),
    [filtered]
  );

  return (
    <div
      className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <PageHeader
        eyebrow={isRTL ? "التقارير" : "Reports"}
        title={isRTL ? "مركز التقارير" : "Reports hub"}
        description={
          isRTL
            ? "كل تقاريرك المالية والتشغيلية في مكان واحد، مبنية على نفس القيود المزدوجة ويمكن تصديرها CSV أو PDF."
            : "Every financial and operational report in one place, all driven by the same double-entry ledger and ready for CSV or PDF export."
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: isRTL ? "التقارير المتاحة" : "Available reports",
            value: reports.length,
            icon: FileSpreadsheet,
          },
          {
            label: isRTL ? "المجموعات" : "Report groups",
            value: groupOrder.length,
            icon: BarChart3,
          },
          {
            label: isRTL ? "جاهز للتصدير" : "Export ready",
            value: isRTL ? "CSV / PDF" : "CSV / PDF",
            icon: ArrowUpRight,
          },
        ].map((item) => (
          <Card key={item.label} className="border-slate-200/80 dark:border-slate-800">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {item.value}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                <item.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="input ps-9"
            placeholder={isRTL ? "ابحث عن تقرير..." : "Search reports..."}
            aria-label={isRTL ? "البحث في التقارير" : "Search reports"}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label={isRTL ? "مسح البحث" : "Clear search"}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {groups.map((item) => (
            <button
              key={item}
              onClick={() => setGroup(item)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                group === item
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <Search className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-medium text-slate-700 dark:text-slate-200">
            {isRTL ? "لا توجد تقارير مطابقة" : "No reports match your search"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {isRTL ? "جرّب كلمة أخرى أو مجموعة مختلفة." : "Try a different keyword or group."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((entry) => (
            <section key={entry.key}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  {entry.key}
                </h2>
                <Badge className="border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  {entry.items.length}
                </Badge>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {entry.items.map((report) => (
                  <Link
                    key={report.path}
                    to={report.path}
                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`rounded-xl bg-gradient-to-br ${report.tone} p-2.5 text-white shadow-sm`}
                      >
                        <report.icon className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-brand-600 dark:group-hover:text-brand-300" />
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                      {report.title}
                    </h3>
                    <p className="mt-1 flex-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {report.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
                      {isRTL ? "فتح التقرير" : "Open report"}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Card className="border-dashed border-slate-300 dark:border-slate-700">
        <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Calculator className="mt-0.5 h-5 w-5 text-brand-600" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                {isRTL ? "كل تقرير قابل للتصدير" : "Every report is export-ready"}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isRTL
                  ? "استخدم أزرار CSV أو PDF أعلى كل تقرير للحصول على نسخة جاهزة للمشاركة."
                  : "Use the CSV or PDF buttons at the top of each report for a share-ready copy."}
              </p>
            </div>
          </div>
          <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            {isRTL ? "مباشر من البيانات" : "Live from your data"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsHub;
