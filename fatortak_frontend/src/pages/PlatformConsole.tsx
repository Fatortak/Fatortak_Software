import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  Globe,
  Package,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  usePlatformOverview,
  usePlatformTenants,
  usePlatformUsers,
  useSetTenantStatus,
  useSetUserRole,
  useSetUserStatus,
} from "@/hooks/usePlatform";
import type {
  PlatformActivityDto,
  PlatformTenantDto,
  PlatformUserDto,
} from "@/types/api";

type Tab = "overview" | "tenants" | "users" | "activity";

const assignableRoles = ["Admin", "Editor", "Watcher"];

const formatNumber = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);

const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const relativeTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
};

const useDebouncedValue = <T,>(value: T, delay = 350) => {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const PlatformConsole: React.FC = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const copy = (en: string, ar: string) => (isRTL ? ar : en);
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [tab, setTab] = useState<Tab>("overview");
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenantStatus, setTenantStatus] = useState("All");
  const [tenantPage, setTenantPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("All");
  const [userStatus, setUserStatus] = useState("All");
  const [userTenant, setUserTenant] = useState("All");
  const [userPage, setUserPage] = useState(1);

  const debouncedTenantSearch = useDebouncedValue(tenantSearch);
  const debouncedUserSearch = useDebouncedValue(userSearch);

  const isSysAdmin =
    user?.role === "SysAdmin" ||
    String(user?.role ?? "").toLowerCase() === "sysadmin";

  const overview = usePlatformOverview(isSysAdmin);
  const tenants = usePlatformTenants(
    {
      search: debouncedTenantSearch,
      status: tenantStatus === "All" ? undefined : tenantStatus,
      pageNumber: tenantPage,
      pageSize: 10,
    },
    isSysAdmin
  );
  const users = usePlatformUsers(
    {
      search: debouncedUserSearch,
      role: userRole === "All" ? undefined : userRole,
      isActive: userStatus === "All" ? undefined : userStatus === "Active",
      tenantId: userTenant === "All" ? undefined : userTenant,
      pageNumber: userPage,
      pageSize: 12,
    },
    isSysAdmin
  );
  const tenantOptions = usePlatformTenants(
    { pageNumber: 1, pageSize: 100 },
    isSysAdmin
  );

  const setTenantStatusMutation = useSetTenantStatus();
  const setUserStatusMutation = useSetUserStatus();
  const setUserRoleMutation = useSetUserRole();

  const overviewData = overview.data?.data;
  const tenantData = tenants.data?.data;
  const userData = users.data?.data;
  const allTenants = tenantOptions.data?.data?.data ?? [];

  const planEntries = useMemo(
    () =>
      Object.entries(overviewData?.planBreakdown ?? {}).sort(
        (a, b) => b[1] - a[1]
      ),
    [overviewData?.planBreakdown]
  );
  const totalPlans = planEntries.reduce((sum, [, count]) => sum + count, 0);

  const refreshAll = () => {
    void overview.refetch();
    void tenants.refetch();
    void users.refetch();
    void tenantOptions.refetch();
  };

  const toggleTenant = async (tenant: PlatformTenantDto) => {
    try {
      await setTenantStatusMutation.mutateAsync({
        tenantId: tenant.id,
        isActive: !tenant.isActive,
      });
      toast.success(
        tenant.isActive
          ? copy(`Suspended ${tenant.name}`, `تم تعليق ${tenant.name}`)
          : copy(`Activated ${tenant.name}`, `تم تفعيل ${tenant.name}`)
      );
    } catch (error: any) {
      toast.error(
        error?.message ||
          copy("Could not update the tenant", "تعذر تحديث مساحة العمل")
      );
    }
  };

  const toggleUser = async (account: PlatformUserDto) => {
    try {
      await setUserStatusMutation.mutateAsync({
        userId: account.id,
        isActive: !account.isActive,
      });
      toast.success(
        account.isActive
          ? copy(`Deactivated ${account.fullName}`, `تم تعطيل ${account.fullName}`)
          : copy(`Activated ${account.fullName}`, `تم تفعيل ${account.fullName}`)
      );
    } catch (error: any) {
      toast.error(
        error?.message || copy("Could not update the user", "تعذر تحديث المستخدم")
      );
    }
  };

  const changeUserRole = async (account: PlatformUserDto, role: string) => {
    try {
      await setUserRoleMutation.mutateAsync({ userId: account.id, role });
      toast.success(
        copy(
          `${account.fullName} is now ${role}`,
          `أصبح دور ${account.fullName} الآن ${role}`
        )
      );
    } catch (error: any) {
      toast.error(
        error?.message || copy("Could not change the role", "تعذر تغيير الدور")
      );
    }
  };

  if (!isSysAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            {copy("Platform owners only", "لمالك المنصة فقط")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {copy(
              "This console shows every tenant and user across the installation. Ask a platform owner for access.",
              "تعرض هذه اللوحة كل مساحات العمل والمستخدمين في النظام. اطلب من مالك المنصة الوصول."
            )}
          </p>
          <Link
            to="/dashboard"
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <ArrowIcon className="h-4 w-4" />
            {copy("Back to dashboard", "العودة للوحة التحكم")}
          </Link>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      label: copy("Tenants", "مساحات العمل"),
      value: formatNumber(overviewData?.tenants ?? 0),
      hint: `${overviewData?.activeTenants ?? 0} ${copy("active", "نشطة")} · ${
        overviewData?.suspendedTenants ?? 0
      } ${copy("suspended", "معلقة")}`,
      icon: Building2,
      tone: "from-indigo-500 to-blue-600",
    },
    {
      label: copy("Users", "المستخدمون"),
      value: formatNumber(overviewData?.users ?? 0),
      hint: `${overviewData?.newUsersLast30Days ?? 0} ${copy(
        "joined in 30 days",
        "انضموا خلال 30 يوماً"
      )}`,
      icon: Users,
      tone: "from-emerald-500 to-teal-600",
    },
    {
      label: copy("Invoices", "الفواتير"),
      value: formatNumber(overviewData?.invoices ?? 0),
      hint: `${formatCompactCurrency(overviewData?.totalInvoiced ?? 0)} ${copy(
        "invoiced",
        "إجمالي الفواتير"
      )}`,
      icon: FileText,
      tone: "from-violet-500 to-purple-600",
    },
    {
      label: copy("Collected", "المحصّل"),
      value: formatCompactCurrency(overviewData?.totalCollected ?? 0),
      hint: copy("Across all tenants", "عبر جميع مساحات العمل"),
      icon: CircleDollarSign,
      tone: "from-amber-500 to-orange-600",
    },
  ];

  const tabs: Array<{ key: Tab; label: string; icon: React.ElementType; count?: number }> = [
    { key: "overview", label: copy("Overview", "نظرة عامة"), icon: BarChart3 },
    {
      key: "tenants",
      label: copy("Tenants", "مساحات العمل"),
      icon: Building2,
      count: overviewData?.tenants,
    },
    {
      key: "users",
      label: copy("Users", "المستخدمون"),
      icon: Users,
      count: overviewData?.users,
    },
    {
      key: "activity",
      label: copy("Activity", "النشاط"),
      icon: Activity,
    },
  ];

  return (
    <div
      className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <PageHeader
        eyebrow={copy("App owner", "مالك التطبيق")}
        title={copy("Platform console", "لوحة المنصة")}
        description={copy(
          "Every tenant, every user and the health of the whole installation in one place.",
          "كل مساحة عمل وكل مستخدم وحالة النظام بالكامل في مكان واحد."
        )}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="success" className="hidden sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              {copy("SysAdmin", "مسؤول النظام")}
            </Badge>
            <Button
              variant="outline"
              onClick={refreshAll}
              loading={
                overview.isFetching ||
                tenants.isFetching ||
                users.isFetching
              }
            >
              <RefreshCw className="h-4 w-4" />
              {copy("Refresh", "تحديث")}
            </Button>
          </div>
        }
      />

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          {overview.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : overview.isError ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {copy("Could not load platform metrics", "تعذر تحميل مؤشرات المنصة")}
                </p>
                <Button variant="outline" onClick={() => overview.refetch()}>
                  {copy("Try again", "حاول مرة أخرى")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((metric) => (
                  <Card
                    key={metric.label}
                    className="overflow-hidden border-slate-200/80 dark:border-slate-800"
                  >
                    <CardContent className="relative p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {metric.label}
                          </p>
                          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {metric.value}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">{metric.hint}</p>
                        </div>
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${metric.tone} text-white shadow-sm`}
                        >
                          <metric.icon className="h-5 w-5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <Card className="border-slate-200/80 dark:border-slate-800">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                          <Building2 className="h-4 w-4 text-brand-600" />
                          {copy("Newest tenants", "أحدث مساحات العمل")}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {copy(
                            "Recently created workspaces across the installation.",
                            "أحدث مساحات العمل المنشأة في النظام."
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTab("tenants")}
                      >
                        {copy("View all", "عرض الكل")}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {(overviewData?.recentTenants ?? []).map((tenant) => (
                        <div
                          key={tenant.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/30"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300">
                              {tenant.name.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {tenant.name}
                              </p>
                              <p className="truncate text-[11px] text-slate-400">
                                {tenant.subdomain
                                  ? `${tenant.subdomain}.fatortak.com`
                                  : copy("No custom URL", "بدون عنوان مخصص")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={tenant.isActive ? "success" : "warning"}>
                              {tenant.isActive
                                ? copy("Active", "نشطة")
                                : copy("Suspended", "معلقة")}
                            </Badge>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(tenant.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(overviewData?.recentTenants ?? []).length === 0 && (
                        <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 dark:border-slate-800">
                          {copy("No tenants yet", "لا توجد مساحات عمل بعد")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="border-slate-200/80 dark:border-slate-800">
                    <CardContent className="space-y-3 p-5">
                      <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                        <CreditCard className="h-4 w-4 text-brand-600" />
                        {copy("Subscription mix", "توزيع الاشتراكات")}
                      </h2>
                      {planEntries.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          {copy("No subscriptions yet", "لا توجد اشتراكات بعد")}
                        </p>
                      ) : (
                        planEntries.map(([plan, count]) => {
                          const percent = totalPlans
                            ? Math.round((count / totalPlans) * 100)
                            : 0;
                          return (
                            <div key={plan} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  {plan}
                                </span>
                                <span className="text-slate-400">
                                  {count} · {percent}%
                                </span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500"
                                  style={{ width: `${Math.max(percent, 4)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200/80 dark:border-slate-800">
                    <CardContent className="space-y-3 p-5">
                      <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                        <Sparkles className="h-4 w-4 text-brand-600" />
                        {copy("Software scale", "حجم البرنامج")}
                      </h2>
                      {[
                        {
                          label: copy("Customers", "العملاء"),
                          value: overviewData?.customers ?? 0,
                          icon: Users,
                        },
                        {
                          label: copy("Items", "الأصناف"),
                          value: overviewData?.items ?? 0,
                          icon: Package,
                        },
                        {
                          label: copy("Active subscriptions", "الاشتراكات النشطة"),
                          value: overviewData?.activeSubscriptions ?? 0,
                          icon: CreditCard,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/40"
                        >
                          <span className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <item.icon className="h-3.5 w-3.5 text-slate-400" />
                            {item.label}
                          </span>
                          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatNumber(item.value)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="border-slate-200/80 dark:border-slate-800">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                      <Activity className="h-4 w-4 text-brand-600" />
                      {copy("Recent activity", "أحدث النشاط")}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setTab("activity")}>
                      {copy("Open log", "فتح السجل")}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <ActivityFeed
                    items={overviewData?.recentActivity ?? []}
                    isRTL={isRTL}
                    compact
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === "tenants" && (
        <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  {copy("All tenants", "كل مساحات العمل")}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {copy(
                    "Suspend a workspace to block sign-in without deleting any data.",
                    "علّق مساحة العمل لمنع تسجيل الدخول دون حذف أي بيانات."
                  )}
                </p>
              </div>
              <Badge variant="outline">
                {tenantData?.totalCount ?? 0} {copy("workspaces", "مساحة")}
              </Badge>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className={`input-icon ${isRTL ? "right-3" : "left-3"}`} />
                <Input
                  value={tenantSearch}
                  onChange={(event) => {
                    setTenantSearch(event.target.value);
                    setTenantPage(1);
                  }}
                  placeholder={copy("Search by name or URL", "ابحث بالاسم أو العنوان")}
                  className={`${isRTL ? "pe-9" : "ps-9"}`}
                />
              </div>
              <Select
                value={tenantStatus}
                onValueChange={(value) => {
                  setTenantStatus(value);
                  setTenantPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-44" aria-label={copy("Status", "الحالة")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{copy("All statuses", "كل الحالات")}</SelectItem>
                  <SelectItem value="Active">{copy("Active", "نشطة")}</SelectItem>
                  <SelectItem value="Suspended">{copy("Suspended", "معلقة")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tenants.isLoading ? (
              <TableSkeleton columns={8} />
            ) : tenants.isError ? (
              <ErrorRow
                message={copy("Could not load tenants", "تعذر تحميل مساحات العمل")}
                onRetry={() => tenants.refetch()}
                isRTL={isRTL}
              />
            ) : (tenantData?.data.length ?? 0) === 0 ? (
              <EmptyRow
                icon={Building2}
                title={copy("No tenants match", "لا توجد مساحات عمل مطابقة")}
                description={copy(
                  "Try a different search or status filter.",
                  "جرّب بحثاً أو حالة مختلفة."
                )}
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy("Workspace", "مساحة العمل")}</TableHead>
                      <TableHead>{copy("Plan", "الخطة")}</TableHead>
                      <TableHead className="text-end">{copy("Users", "المستخدمون")}</TableHead>
                      <TableHead className="text-end">{copy("Invoices", "الفواتير")}</TableHead>
                      <TableHead className="text-end">{copy("Customers", "العملاء")}</TableHead>
                      <TableHead className="text-end">{copy("Items", "الأصناف")}</TableHead>
                      <TableHead>{copy("Last activity", "آخر نشاط")}</TableHead>
                      <TableHead className="text-end">{copy("Status", "الحالة")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tenantData?.data ?? []).map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {tenant.name.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                                  {tenant.name}
                                </p>
                                {tenant.isCurrent && (
                                  <Badge variant="brand" className="text-[10px]">
                                    {copy("Current", "الحالية")}
                                  </Badge>
                                )}
                              </div>
                              <p className="truncate text-[11px] text-slate-400">
                                {tenant.subdomain
                                  ? `${tenant.subdomain}.fatortak.com`
                                  : copy("No custom URL", "بدون عنوان مخصص")}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tenant.plan || "—"}</Badge>
                        </TableCell>
                        <TableCell className="text-end tabular-nums">{tenant.userCount}</TableCell>
                        <TableCell className="text-end tabular-nums">{tenant.invoiceCount}</TableCell>
                        <TableCell className="text-end tabular-nums">{tenant.customerCount}</TableCell>
                        <TableCell className="text-end tabular-nums">{tenant.itemCount}</TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                          {relativeTime(tenant.lastActivityAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Badge variant={tenant.isActive ? "success" : "warning"}>
                              {tenant.isActive
                                ? copy("Active", "نشطة")
                                : copy("Suspended", "معلقة")}
                            </Badge>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              disabled={tenant.isCurrent || setTenantStatusMutation.isPending}
                              onClick={() => void toggleTenant(tenant)}
                              title={
                                tenant.isCurrent
                                  ? copy(
                                      "Switch workspace before suspending it",
                                      "بدّل مساحة العمل قبل تعليقها"
                                    )
                                  : tenant.isActive
                                    ? copy("Suspend", "تعليق")
                                    : copy("Activate", "تفعيل")
                              }
                              aria-label={
                                tenant.isActive
                                  ? copy("Suspend tenant", "تعليق مساحة العمل")
                                  : copy("Activate tenant", "تفعيل مساحة العمل")
                              }
                            >
                              {tenant.isActive ? (
                                <PauseCircle className="h-4 w-4 text-amber-600" />
                              ) : (
                                <PlayCircle className="h-4 w-4 text-emerald-600" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <Pagination
              page={tenantPage}
              pageSize={10}
              total={tenantData?.totalCount ?? 0}
              onChange={setTenantPage}
              isRTL={isRTL}
              copy={copy}
            />
          </CardContent>
        </Card>
      )}

      {tab === "users" && (
        <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  {copy("All users", "كل المستخدمين")}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {copy(
                    "Manage access across every workspace. Platform owners are protected.",
                    "أدر الوصول عبر جميع مساحات العمل. مالك المنصة محمي."
                  )}
                </p>
              </div>
              <Badge variant="outline">
                {userData?.totalCount ?? 0} {copy("users", "مستخدم")}
              </Badge>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <div className="relative">
                <Search className={`input-icon ${isRTL ? "right-3" : "left-3"}`} />
                <Input
                  value={userSearch}
                  onChange={(event) => {
                    setUserSearch(event.target.value);
                    setUserPage(1);
                  }}
                  placeholder={copy("Search name or email", "ابحث بالاسم أو البريد")}
                  className={`${isRTL ? "pe-9" : "ps-9"}`}
                />
              </div>
              <Select
                value={userTenant}
                onValueChange={(value) => {
                  setUserTenant(value);
                  setUserPage(1);
                }}
              >
                <SelectTrigger aria-label={copy("Tenant", "مساحة العمل")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{copy("All workspaces", "كل المساحات")}</SelectItem>
                  {allTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={userRole}
                onValueChange={(value) => {
                  setUserRole(value);
                  setUserPage(1);
                }}
              >
                <SelectTrigger aria-label={copy("Role", "الدور")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{copy("All roles", "كل الأدوار")}</SelectItem>
                  <SelectItem value="SysAdmin">SysAdmin</SelectItem>
                  {assignableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={userStatus}
                onValueChange={(value) => {
                  setUserStatus(value);
                  setUserPage(1);
                }}
              >
                <SelectTrigger aria-label={copy("Status", "الحالة")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{copy("All statuses", "كل الحالات")}</SelectItem>
                  <SelectItem value="Active">{copy("Active", "نشط")}</SelectItem>
                  <SelectItem value="Inactive">{copy("Inactive", "معطل")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {users.isLoading ? (
              <TableSkeleton columns={6} />
            ) : users.isError ? (
              <ErrorRow
                message={copy("Could not load users", "تعذر تحميل المستخدمين")}
                onRetry={() => users.refetch()}
                isRTL={isRTL}
              />
            ) : (userData?.data.length ?? 0) === 0 ? (
              <EmptyRow
                icon={Users}
                title={copy("No users match", "لا يوجد مستخدمون مطابقون")}
                description={copy(
                  "Try a different search, workspace or role.",
                  "جرّب بحثاً أو مساحة عمل أو دوراً مختلفاً."
                )}
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy("User", "المستخدم")}</TableHead>
                      <TableHead>{copy("Workspace", "مساحة العمل")}</TableHead>
                      <TableHead>{copy("Role", "الدور")}</TableHead>
                      <TableHead>{copy("Last seen", "آخر ظهور")}</TableHead>
                      <TableHead>{copy("Status", "الحالة")}</TableHead>
                      <TableHead className="text-end">{copy("Actions", "إجراءات")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(userData?.data ?? []).map((account) => {
                      const locked = account.isOwner || account.isCurrent;
                      return (
                        <TableRow key={account.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                                {account.fullName
                                  .split(" ")
                                  .map((part) => part.charAt(0))
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                                    {account.fullName || "—"}
                                  </p>
                                  {account.isOwner && (
                                    <Badge variant="brand" className="text-[10px]">
                                      <ShieldCheck className="h-3 w-3" />
                                      {copy("Owner", "المالك")}
                                    </Badge>
                                  )}
                                  {account.isCurrent && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {copy("You", "أنت")}
                                    </Badge>
                                  )}
                                </div>
                                <p className="truncate text-[11px] text-slate-400">{account.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                            {account.tenantName || copy("Unassigned", "غير معيّن")}
                          </TableCell>
                          <TableCell>
                            {account.isOwner ? (
                              <Badge variant="brand">SysAdmin</Badge>
                            ) : (
                              <Select
                                value={account.role}
                                onValueChange={(value) =>
                                  void changeUserRole(account, value)
                                }
                                disabled={locked || setUserRoleMutation.isPending}
                              >
                                <SelectTrigger className="h-8 w-[118px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {assignableRoles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {role}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                            {relativeTime(account.lastSeenAt || account.lastLoginAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={account.isActive ? "success" : "destructive"}>
                              {account.isActive
                                ? copy("Active", "نشط")
                                : copy("Inactive", "معطل")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={locked || setUserStatusMutation.isPending}
                                onClick={() => void toggleUser(account)}
                                title={
                                  account.isCurrent
                                    ? copy("You cannot deactivate yourself", "لا يمكنك تعطيل حسابك")
                                    : account.isOwner
                                      ? copy("The owner role is protected", "دور المالك محمي")
                                      : account.isActive
                                        ? copy("Deactivate", "تعطيل")
                                        : copy("Activate", "تفعيل")
                                }
                              >
                                {account.isActive ? (
                                  <>
                                    <PauseCircle className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">
                                      {copy("Deactivate", "تعطيل")}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <PlayCircle className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">
                                      {copy("Activate", "تفعيل")}
                                    </span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <Pagination
              page={userPage}
              pageSize={12}
              total={userData?.totalCount ?? 0}
              onChange={setUserPage}
              isRTL={isRTL}
              copy={copy}
            />
          </CardContent>
        </Card>
      )}

      {tab === "activity" && (
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Activity className="h-4 w-4 text-brand-600" />
                {copy("Cross-tenant activity", "النشاط عبر المساحات")}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {copy(
                  "The latest audit events from every workspace.",
                  "أحدث أحداث التدقيق من جميع مساحات العمل."
                )}
              </p>
            </div>
            {overview.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : (
              <ActivityFeed
                items={overviewData?.recentActivity ?? []}
                isRTL={isRTL}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const ActivityFeed: React.FC<{
  items: PlatformActivityDto[];
  isRTL: boolean;
  compact?: boolean;
}> = ({ items, isRTL, compact }) => {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 dark:border-slate-800">
        {isRTL ? "لا يوجد نشاط بعد" : "No activity yet"}
      </p>
    );
  }

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <Activity className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-800 dark:text-slate-100">
              <span className="font-semibold">{item.userName || "System"}</span>{" "}
              <span className="text-slate-500 dark:text-slate-400">{item.action}</span>{" "}
              <span className="font-medium">{item.entityType}</span>
              {item.entityLabel ? ` · ${item.entityLabel}` : ""}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
              <Globe className="h-3 w-3" />
              {item.tenantName || (isRTL ? "النظام" : "System")}
              <span>·</span>
              {relativeTime(item.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const Pagination: React.FC<{
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  isRTL: boolean;
  copy: (en: string, ar: string) => string;
}> = ({ page, pageSize, total, onChange, isRTL, copy }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const PreviousIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
      <span>
        {copy("Showing", "عرض")} {(page - 1) * pageSize + 1}–
        {Math.min(page * pageSize, total)} {copy("of", "من")} {total}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label={copy("Previous page", "الصفحة السابقة")}
        >
          <PreviousIcon className="h-4 w-4" />
        </Button>
        <span className="min-w-[70px] text-center font-medium">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label={copy("Next page", "الصفحة التالية")}
        >
          <NextIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const TableSkeleton: React.FC<{ columns: number }> = ({ columns }) => (
  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
    <div className="h-10 bg-slate-50 dark:bg-slate-800/60" />
    {Array.from({ length: 5 }).map((_, row) => (
      <div
        key={row}
        className="grid gap-3 border-t border-slate-100 p-3 dark:border-slate-800"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((__, column) => (
          <div
            key={column}
            className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    ))}
  </div>
);

const ErrorRow: React.FC<{
  message: string;
  onRetry: () => void;
  isRTL: boolean;
}> = ({ message, onRetry, isRTL }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/20">
    <AlertTriangle className="h-6 w-6 text-amber-500" />
    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{message}</p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      <RefreshCw className="h-3.5 w-3.5" />
      {isRTL ? "حاول مرة أخرى" : "Try again"}
    </Button>
  </div>
);

const EmptyRow: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
    <Icon className="h-7 w-7 text-slate-300 dark:text-slate-600" />
    <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
    <p className="mt-1 text-xs text-slate-400">{description}</p>
  </div>
);

export default PlatformConsole;
