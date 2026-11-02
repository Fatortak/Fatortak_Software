import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  Users,
  BarChart3,
  Settings,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  LogOut,
  X,
  ShoppingCart,
  Receipt,
  Truck,
  DollarSign,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  LayoutTemplate,
  Warehouse,
  TrendingUp,
  ClipboardList,
  Package2,
  FolderKanban,
  Wallet,
  Landmark,
  BookOpen,
  Calculator,
  Tag,
  Server,
  ShieldCheck,
  MonitorSmartphone,
  Upload,
  Rocket,
  History,
  BadgePercent,
  Boxes,
  Contact,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";

interface ModernSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

interface NavItem {
  name: string;
  icon: React.ElementType;
  path: string;
  subItems?: NavItem[];
}

interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onClose,
  isMobile = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isRTL, t } = useLanguage();
  const { user, logout } = useAuth();
  const canViewInstallation =
    user?.role === "Admin" || user?.role === "SysAdmin";
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    sales: true,
    purchasing: true,
    finance: true,
    inventory: true,
    contacts: true,
    reporting: true,
    workspace: true,
  });

  const pathname = location.pathname;

  const groups: NavGroup[] = [
    {
      key: "overview",
      label: isRTL ? "نظرة عامة" : "Overview",
      items: [
        { name: t("dashboard") || "Dashboard", icon: Home, path: "/dashboard" },
        {
          name: isRTL ? "البداية" : "Getting Started",
          icon: Rocket,
          path: "/onboarding",
        },
      ],
    },
    {
      key: "sales",
      label: isRTL ? "المبيعات" : "Sales",
      items: [
        {
          name: isRTL ? "عروض الأسعار" : "Quotations",
          icon: FileText,
          path: "/quotations",
        },
        {
          name: isRTL ? "أوامر البيع" : "Sales Orders",
          icon: ClipboardList,
          path: "/sales-orders",
        },
        {
          name: isRTL ? "إشعارات التسليم" : "Delivery Notes",
          icon: Truck,
          path: "/delivery-notes",
        },
        {
          name: t("sellInvoices") || "Sales Invoices",
          icon: Receipt,
          path: "/sell-invoices",
        },
        {
          name: isRTL ? "إشعارات دائنة ومدينة" : "Credit & Debit Notes",
          icon: FileText,
          path: "/credit-notes",
        },
        {
          name: isRTL ? "الفواتير المتكررة" : "Recurring Invoices",
          icon: CalendarDays,
          path: "/recurring-invoices",
        },
        {
          name: isRTL ? "قوائم الأسعار" : "Price Lists",
          icon: Tag,
          path: "/price-lists",
        },
        {
          name: isRTL ? "عمولات المبيعات" : "Sales Commissions",
          icon: BadgePercent,
          path: "/commissions",
        },
      ],
    },
    {
      key: "purchasing",
      label: isRTL ? "المشتريات" : "Purchasing",
      items: [
        {
          name: isRTL ? "طلبات الشراء" : "Purchase Requisitions",
          icon: ClipboardList,
          path: "/purchase-requisitions",
        },
        {
          name: isRTL ? "طلبات عروض الأسعار" : "Request for Quotations",
          icon: ClipboardList,
          path: "/rfqs",
        },
        {
          name: isRTL ? "أوامر الشراء" : "Purchase Orders",
          icon: ShoppingCart,
          path: "/purchase-orders",
        },
        {
          name: isRTL ? "سندات الاستلام" : "Goods Receipts",
          icon: Package2,
          path: "/goods-receipts",
        },
        {
          name: t("buyInvoices") || "Purchase Invoices",
          icon: ShoppingCart,
          path: "/buy-invoices",
        },
      ],
    },
    {
      key: "finance",
      label: isRTL ? "المالية والمحاسبة" : "Finance",
      items: [
        {
          name: isRTL ? "المحاسبة" : "Accounting",
          icon: Calculator,
          path: "/accounting",
          subItems: [
            {
              name: isRTL ? "دليل الحسابات" : "Chart of Accounts",
              path: "/chart-of-accounts",
              icon: BookOpen,
            },
            {
              name: isRTL ? "قيود اليومية" : "Journal Entries",
              path: "/journal-entries",
              icon: FileText,
            },
            {
              name: isRTL ? "الشيكات" : "Cheques",
              path: "/cheques",
              icon: Wallet,
            },
            {
              name: isRTL ? "أصحاب المصالح" : "Stakeholders",
              path: "/stakeholders",
              icon: Users,
            },
          ],
        },
        {
          name: isRTL ? "مطابقة البنك" : "Bank Reconciliation",
          icon: Landmark,
          path: "/bank-reconciliation",
        },
        {
          name: isRTL ? "الإقرار الضريبي" : "VAT Return",
          icon: Calculator,
          path: "/tax-reports",
        },
        {
          name: isRTL ? "المصروفات" : "Expenses",
          icon: DollarSign,
          path: "/expenses-group",
          subItems: [
            {
              name: isRTL ? "المصروفات" : "Expenses",
              path: "/expenses",
              icon: DollarSign,
            },
            {
              name: isRTL ? "فئات المصروفات" : "Expense Categories",
              path: "/expense-categories",
              icon: Tag,
            },
          ],
        },
        {
          name: isRTL ? "إدارة العهد" : "Custody Management",
          icon: Wallet,
          path: "/custody",
        },
      ],
    },
    {
      key: "inventory",
      label: isRTL ? "المخزون والبيانات" : "Inventory & Data",
      items: [
        {
          name: isRTL ? "تقييم المخزون" : "Inventory Valuation",
          icon: Warehouse,
          path: "/inventory",
        },
        {
          name: isRTL ? "الأصناف" : "Items",
          icon: Boxes,
          path: "/items",
        },
        {
          name: isRTL ? "استيراد البيانات" : "Data Import",
          icon: Upload,
          path: "/data-import",
        },
      ],
    },
    {
      key: "contacts",
      label: isRTL ? "العملاء والمشاريع" : "Contacts & Projects",
      items: [
        { name: t("clients") || "Clients", icon: Contact, path: "/clients" },
        {
          name: t("suppliers") || "Suppliers",
          icon: Truck,
          path: "/suppliers",
        },
        {
          name: isRTL ? "المشاريع" : "Projects",
          icon: FolderKanban,
          path: "/projects",
        },
      ],
    },
    {
      key: "reporting",
      label: isRTL ? "التقارير والقوالب" : "Reports & Templates",
      items: [
        {
          name: t("reports") || "Reports",
          icon: BarChart3,
          path: "/reports-group",
          subItems: [
            {
              name: isRTL ? "ملخص التقارير" : "Reports Hub",
              path: "/reports",
              icon: BarChart3,
            },
            {
              name: isRTL ? "ميزان المراجعة" : "Trial Balance",
              path: "/reports/trial-balance",
              icon: Calculator,
            },
            {
              name: isRTL ? "دفتر الأستاذ" : "General Ledger",
              path: "/reports/ledger",
              icon: BookOpen,
            },
            {
              name: isRTL ? "قائمة الدخل" : "Income Statement",
              path: "/reports/income-statement",
              icon: TrendingUp,
            },
            {
              name: isRTL ? "الميزانية العمومية" : "Balance Sheet",
              path: "/reports/balance-sheet",
              icon: Landmark,
            },
            {
              name: isRTL ? "التدفق النقدي" : "Cash Flow",
              path: "/reports/cash-flow",
              icon: DollarSign,
            },
            {
              name: isRTL ? "حركة النقد والبنك" : "Cash & Bank Movements",
              path: "/reports/cash-bank-movements",
              icon: Landmark,
            },
            {
              name: isRTL ? "أعمار المدينين" : "AR Aging",
              path: "/reports/ar-aging",
              icon: ClipboardList,
            },
            {
              name: isRTL ? "أعمار الدائنين" : "AP Aging",
              path: "/reports/ap-aging",
              icon: ClipboardList,
            },
            {
              name: isRTL ? "كشف حساب عميل" : "Customer Statement",
              path: "/reports/customer-statement",
              icon: Users,
            },
            {
              name: isRTL ? "كشف حساب مورد" : "Vendor Statement",
              path: "/reports/vendor-statement",
              icon: Truck,
            },
            {
              name: isRTL ? "تقرير المبيعات" : "Sales Report",
              path: "/reports/sales",
              icon: Receipt,
            },
            {
              name: isRTL ? "ربحية المشاريع" : "Project Profitability",
              path: "/reports/project-profitability",
              icon: FolderKanban,
            },
          ],
        },
        {
          name: t("invoiceTemplates") || "Invoice Templates",
          icon: LayoutTemplate,
          path: "/invoice-templates",
          subItems: [
            {
              name: t("buyTemplates") || "Buy Templates",
              path: "/invoice-templates/buy",
              icon: ShoppingCart,
            },
            {
              name: t("sellTemplates") || "Sell Templates",
              path: "/invoice-templates/sell",
              icon: Receipt,
            },
          ],
        },
      ],
    },
    {
      key: "workspace",
      label: isRTL ? "الفريق والإعدادات" : "Workspace",
      items: [
        {
          name: isRTL ? "قائمة الاعتماد" : "Approval Queue",
          icon: ShieldCheck,
          path: "/approvals",
        },
        {
          name: isRTL ? "سجل النشاط" : "Activity Log",
          icon: History,
          path: "/activity",
        },
        { name: t("team") || "Team", icon: UserCheck, path: "/team" },
        {
          name: isRTL ? "الجلسات والأجهزة" : "Sessions & Devices",
          icon: MonitorSmartphone,
          path: "/sessions",
        },
        { name: t("settings") || "Settings", icon: Settings, path: "/settings" },
        ...(canViewInstallation
          ? [
              {
                name: isRTL ? "معلومات التثبيت" : "Installation insights",
                icon: Server,
                path: "/installation",
              },
            ]
          : []),
      ],
    },
  ];

  useEffect(() => {
    // Open the group that contains the current route.
    for (const group of groups) {
      const inGroup = group.items.some(
        (item) =>
          pathname === item.path ||
          pathname.startsWith(`${item.path}/`) ||
          item.subItems?.some(
            (sub) =>
              pathname === sub.path || pathname.startsWith(`${sub.path}/`)
          )
      );
      if (inGroup) {
        setOpenGroups((prev) => ({ ...prev, [group.key]: true }));
        break;
      }
    }

    for (const group of groups) {
      for (const item of group.items) {
        if (item.subItems?.some((sub) => pathname.startsWith(sub.path))) {
          setOpenSubmenus((prev) => ({ ...prev, [item.path]: true }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = collapsed ? "auto" : "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobile, collapsed]);

  const toggleSubmenu = (key: string) =>
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast.error(`${t("logoutError")}: ${error}`);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile && onClose) onClose();
  };

  const rowClass =
    collapsed && !isMobile ? "justify-center" : isRTL ? "flex-row-reverse" : "";

  const renderMenuItems = (items: NavItem[], level = 0) =>
    items.map((item) => {
      const Icon = item.icon;
      const isActive =
        pathname === item.path ||
        pathname.startsWith(`${item.path}/`) ||
        item.subItems?.some(
          (sub) =>
            pathname === sub.path || pathname.startsWith(`${sub.path}/`)
        );
      const hasSubItems = !!item.subItems?.length;
      const isSubmenuOpen = openSubmenus[item.path] || false;

      return (
        <li key={item.path}>
          <button
            onClick={() =>
              hasSubItems
                ? toggleSubmenu(item.path)
                : handleNavigation(item.path)
            }
            className={`
              group relative flex min-h-[44px] w-full items-center rounded-xl px-3 py-2.5 text-start
              transition-all duration-200 touch-manipulation ${rowClass}
              ${
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70"
              }
            `}
            style={
              level > 0
                ? { paddingInlineStart: `${12 + level * 16}px` }
                : undefined
            }
            title={collapsed && !isMobile ? item.name : undefined}
            aria-current={isActive && !hasSubItems ? "page" : undefined}
          >
            {isActive && (
              <span
                className={`absolute inset-y-2 w-1 rounded-full bg-brand-600 dark:bg-brand-300 ${
                  isRTL ? "right-0" : "left-0"
                }`}
              />
            )}
            <Icon
              className={`h-[18px] w-[18px] shrink-0 ${
                collapsed && !isMobile ? "" : isRTL ? "ml-3" : "mr-3"
              }`}
            />
            {(!collapsed || isMobile) && (
              <>
                <span className="flex-1 truncate text-[13px] font-medium">
                  {item.name}
                </span>
                {hasSubItems ? (
                  isSubmenuOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  )
                ) : null}
              </>
            )}
          </button>

          {hasSubItems && (!collapsed || isMobile) && isSubmenuOpen && (
            <ul className="mt-1 space-y-0.5 border-s border-slate-100 ps-2 dark:border-slate-800">
              {renderMenuItems(item.subItems!, level + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <>
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`
          fixed top-0 z-50 flex h-screen flex-col border-slate-200/80 bg-white transition-all duration-300 ease-in-out
          dark:border-slate-800 dark:bg-slate-900
          ${isRTL ? "right-0" : "left-0"}
          ${
            isMobile
              ? `w-72 max-w-[84vw] ${
                  collapsed
                    ? isRTL
                      ? "translate-x-full"
                      : "-translate-x-full"
                    : "translate-x-0"
                }`
              : `${collapsed ? "w-[76px]" : "w-[268px]"} relative ${
                  isRTL ? "border-l" : "border-r"
                }`
          }
        `}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <div
            className={`flex min-w-0 items-center ${
              isRTL ? "space-x-reverse space-x-3" : "space-x-3"
            }`}
          >
            {collapsed && !isMobile ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                F
              </div>
            ) : (
              <img
                src="/lovable-uploads/fatortak-logo.png"
                alt="FATORTAK"
                className="h-8 w-auto max-w-[180px] object-contain dark:brightness-0 dark:invert"
              />
            )}
          </div>

          {isMobile && (
            <button
              onClick={onClose}
              aria-label={isRTL ? "إغلاق القائمة" : "Close navigation"}
              className="shrink-0 rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
        </div>

        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`
              absolute top-6 z-10 hidden h-6 w-6 items-center justify-center rounded-full border
              border-slate-300 bg-white shadow-md transition-all hover:bg-slate-50 lg:flex
              dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700
              ${isRTL ? "-left-3" : "-right-3"}
            `}
          >
            {collapsed ? (
              isRTL ? (
                <ChevronLeft className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : isRTL ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
        )}

        <nav
          aria-label={isRTL ? "القائمة الرئيسية" : "Main navigation"}
          className="mt-2 max-h-[calc(100vh-8rem)] flex-1 overflow-y-auto overscroll-contain px-3"
        >
          <div className="space-y-3 pb-4 pt-2">
            {groups.map((group) => {
              const isGroupOpen = openGroups[group.key] !== false;
              return (
                <div key={group.key}>
                  {(!collapsed || isMobile) && (
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="mb-1 flex w-full items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                      aria-expanded={isGroupOpen}
                    >
                      <span>{group.label}</span>
                      {isGroupOpen ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                  {collapsed && !isMobile && (
                    <div className="mx-2 mb-1 border-t border-slate-100 dark:border-slate-800" />
                  )}
                  {(isGroupOpen || collapsed) && (
                    <ul className="space-y-0.5">
                      {renderMenuItems(group.items)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className={`flex min-h-[44px] w-full items-center rounded-xl px-3 py-2.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 ${rowClass}`}
            title={collapsed && !isMobile ? "Logout" : undefined}
          >
            <LogOut
              className={`h-5 w-5 shrink-0 ${
                collapsed && !isMobile ? "" : isRTL ? "ml-3" : "mr-3"
              }`}
            />
            {(!collapsed || isMobile) && (
              <span className="truncate text-sm font-medium">
                {isRTL ? "تسجيل الخروج" : "Logout"}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ModernSidebar;
