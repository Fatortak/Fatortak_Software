import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  MessageSquare,
  UserCheck,
  Bell,
  ChevronRight,
  ChevronLeft,
  Building2,
  LogOut,
  X,
  ShoppingCart,
  Receipt,
  Truck,
  DollarSign,
  ChevronDown,
  ChevronUp,
  UserCog,
  Building,
  CalendarCheck,
  CalendarDays,
  Calendar,
  ScanText,
  LayoutTemplate,
  ArrowLeftRight,
  // 🆕 NEW ICONS for Stock Reports
  Warehouse,
  TrendingUp,
  ClipboardList,
  Package2,
  FolderKanban,
  Wallet,
  Landmark,
  // Accounting Icons
  BookOpen,
  Calculator,
  Tag,
  Server,
  ShieldCheck,
  History,
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
  const [activeItem, setActiveItem] = useState("");
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const pathname = location.pathname;

  useEffect(() => {
    setActiveItem(pathname);

    // Automatically open HR submenu if any HR route is active
    // if (pathname.includes("/hr/")) {
    //   setOpenSubmenus((prev) => ({ ...prev, hr: true }));
    // }

    // Automatically open Reports submenu if any report route is active
    if (pathname.includes("/reports/")) {
      setOpenSubmenus((prev) => ({ ...prev, reports: true }));
    }

    // Automatically open Invoice Templates submenu if any template route is active
    if (pathname.includes("/invoice-templates/")) {
      setOpenSubmenus((prev) => ({ ...prev, invoiceTemplates: true }));
    }

    // Automatically open Accounting submenu if any accounting route is active
    if (
      pathname.includes("/chart-of-accounts") ||
      pathname.includes("/journal-entries") ||
      pathname.includes("/financial-reports") ||
      pathname.includes("/cheques")
    ) {
      setOpenSubmenus((prev) => ({ ...prev, "/accounting": true }));
    }

    // Automatically open Expenses submenu if any expense route is active
    if (
      pathname.includes("/expenses") ||
      pathname.includes("/expense-categories")
    ) {
      setOpenSubmenus((prev) => ({ ...prev, "/expenses-group": true }));
    }
  }, [pathname]);

  // Prevent background scroll on mobile when open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = collapsed ? "auto" : "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobile, collapsed]);

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuItems = [
    { name: t("dashboard") || "Dashboard", icon: Home, path: "/dashboard" },
    {
      name: t("buyInvoices") || "Purchase Invoices",
      icon: ShoppingCart,
      path: "/buy-invoices",
    },
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
      name: isRTL ? "إذون الاستلام" : "Goods Receipts",
      icon: Package2,
      path: "/goods-receipts",
    },
    {
      name: t("sellInvoices") || "Sales Invoices",
      icon: Receipt,
      path: "/sell-invoices",
    },
    {
      name: isRTL ? "الإشعارات الدائنة والمدينة" : "Credit & Debit Notes",
      icon: FileText,
      path: "/credit-notes",
    },
    {
      name: isRTL ? "الفواتير المتكررة" : "Recurring Invoices",
      icon: CalendarDays,
      path: "/recurring-invoices",
    },
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
    {
      name: isRTL ? "مطابقة البنك" : "Bank Reconciliation",
      icon: Landmark,
      path: "/bank-reconciliation",
    },
    {
      name: isRTL ? "عروض الأسعار" : "Quotations",
      icon: ClipboardList,
      path: "/quotations",
    },
    {
      name: isRTL ? "أوامر البيع" : "Sales Orders",
      icon: Truck,
      path: "/sales-orders",
    },
    {
      name: isRTL ? "أذون التسليم" : "Delivery Notes",
      icon: Truck,
      path: "/delivery-notes",
    },
    {
      name: t("expenses") || "Expenses",
      icon: DollarSign,
      path: "/expenses-group",
      subItems: [
        {
          name: t("expenses") || "Expenses",
          path: "/expenses",
          icon: DollarSign,
        },
        {
          name: isRTL ? "تصنيفات المصاريف" : "Expense Categories",
          path: "/expense-categories",
          icon: Tag,
        },
      ],
    },
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
          name: isRTL ? "أصحاب المصلحة" : "Stakeholders",
          path: "/stakeholders",
          icon: Users,
        },
      ],
    },
    {
      name: isRTL ? "إدارة العهد" : "Custody Management",
      path: "/custody",
      icon: Wallet,
    },
    { name: t("clients") || "Clients", icon: Users, path: "/clients" },
    {
      name: isRTL ? "المشاريع" : "Projects",
      icon: FolderKanban,
      path: "/projects",
    },
    { name: t("suppliers") || "Suppliers", icon: Truck, path: "/suppliers" },
    // { name: t("items") || "Items", icon: Package, path: "/items" },
    // {
    //   name: t("hr") || "HR Management",
    //   icon: UserCog,
    //   path: "/hr",
    //   subItems: [
    //     {
    //       name: t("employees") || "Employees",
    //       path: "/employees",
    //       icon: Users,
    //     },
    //     {
    //       name: t("departments") || "Departments",
    //       path: "/departments",
    //       icon: Building2,
    //     },
    //     {
    //       name: t("attendances") || "Attendances",
    //       path: "/attendances",
    //       icon: CalendarCheck,
    //     },
    //     { name: t("payroll") || "Payroll", path: "/payroll", icon: DollarSign },
    //     {
    //       name: t("reports") || "Reports",
    //       path: "/hr/reports",
    //       subItems: [
    //         {
    //           name: t("dailyAttendanceReport") || "Daily Attendance Report",
    //           path: "/daily-attendance",
    //           icon: CalendarDays,
    //         },
    //         {
    //           name: t("monthlyAttendanceReport") || "Monthly Attendance Report",
    //           path: "/monthly-attendance",
    //           icon: Calendar,
    //         },
    //       ],
    //     },
    //   ],
    // },
    {
      name: t("reports") || "Reports",
      icon: BarChart3,
      path: "/reports-group",
      subItems: [
        {
          name: isRTL ? "حركة الصندوق والبنوك" : "Cash & Bank Movements",
          path: "/reports/cash-bank-movements",
          icon: Landmark,
        },
        {
          name: isRTL ? "ميزان المراجعة" : "Trial Balance",
          path: "/reports/trial-balance",
          icon: Calculator,
        },
        {
          name: isRTL ? "دفتر الأستاذ العام" : "General Ledger",
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
          name: isRTL ? "التدفقات النقدية" : "Cash Flow",
          path: "/reports/cash-flow",
          icon: DollarSign,
        },
        {
          name: isRTL ? "أعمار ديون العملاء" : "AR Aging",
          path: "/reports/ar-aging",
          icon: ClipboardList,
        },
        {
          name: isRTL ? "أعمار ديون الموردين" : "AP Aging",
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
    { name: t("team") || "Team", icon: UserCheck, path: "/team" },
    { name: t("settings") || "Settings", icon: Settings, path: "/settings" },
    ...(canViewInstallation
      ? [
          {
            name: isRTL ? "بيانات التثبيت" : "Installation insights",
            icon: Server,
            path: "/installation",
          },
        ]
      : []),
    // {
    //   name: t("invoiceScanner") || "Invoice Scanner",
    //   icon: ScanText,
    //   path: "/ocr-invoice",
    // },
    // { name: t("aiChat") || "AI Chat", icon: MessageSquare, path: "/ai-chat" },
  ];

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

  // Recursive function to render menu items with nested submenus
  const renderMenuItems = (items: any[], level = 0) => {
    return items.map((item, index) => {
      // Skip dividers or disabled items
      if (item.disabled) {
        return (
          <li key={index} className="pointer-events-none">
            {(!collapsed || isMobile) && (
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">
                {item.name === "─────────" ? (
                  <hr className="border-slate-300 dark:border-slate-700" />
                ) : (
                  item.name
                )}
              </div>
            )}
          </li>
        );
      }

      const Icon = item.icon;
      const isActive =
        activeItem === item.path ||
        (item.subItems &&
          item.subItems.some((subItem: any) => activeItem === subItem.path));
      const hasSubItems = item.subItems && item.subItems.length > 0;
      const isSubmenuOpen = openSubmenus[item.path] || false;
      const paddingLeft = level * 20;

      return (
        <li key={index}>
          <button
            onClick={() =>
              hasSubItems
                ? toggleSubmenu(item.path)
                : handleNavigation(item.path)
            }
            className={`
              w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 group text-start
              touch-manipulation min-h-[48px] relative ${rowClass}
              ${
                isActive
                  ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-900"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70"
              }
            `}
            style={level > 0 ? { paddingLeft: `${paddingLeft}px` } : {}}
            title={collapsed && !isMobile ? item.name : undefined}
          >
            {Icon && (
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  collapsed && !isMobile ? "" : isRTL ? "ml-3" : "mr-3"
                }`}
              />
            )}
            {(!collapsed || isMobile) && (
              <>
                <span
                  className={`text-sm font-medium flex-1 truncate ${
                    isRTL ? "text-end" : "text-start"
                  }`}
                >
                  {item.name}
                </span>
                {hasSubItems && (
                  <div className={`shrink-0 ${isRTL ? "mr-auto" : "ml-auto"}`}>
                    {isSubmenuOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                )}
                {!hasSubItems && isActive && (
                  <div
                    className={`w-1.5 h-1.5 bg-brand-600 dark:bg-brand-300 rounded-full shrink-0 ${
                      isRTL ? "mr-auto" : "ml-auto"
                    }`}
                  />
                )}
              </>
            )}
          </button>

          {/* Submenu Items */}
          {hasSubItems && (!collapsed || isMobile) && isSubmenuOpen && (
            <ul className={`${isRTL ? "mr-6" : "ml-6"} mt-1 space-y-1`}>
              {renderMenuItems(item.subItems, level + 1)}
            </ul>
          )}
        </li>
      );
    });
  };

  return (
    <>
      {/* Overlay for Mobile */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 ${isRTL ? "right-0" : "left-0"} z-50
          h-screen bg-white dark:bg-slate-900 flex flex-col transition-all duration-300 ease-in-out
          border-slate-200/80 dark:border-slate-800 transform-gpu
          ${
            isMobile
              ? `w-72 max-w-[80vw] ${
                  collapsed
                    ? isRTL
                      ? "translate-x-full"
                      : "-translate-x-full"
                    : "translate-x-0"
                }`
              : `${collapsed ? "w-16" : "w-72"} relative border-r`
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div
            className={`flex items-center min-w-0 ${
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

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={onClose}
              aria-label={isRTL ? "إغلاق القائمة" : "Close navigation"}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
        </div>

        {/* Collapse Toggle - Desktop only */}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`
              absolute top-6 w-6 h-6 bg-white dark:bg-slate-800 
              border border-slate-300 dark:border-slate-600 rounded-full 
              flex items-center justify-center shadow-md hover:shadow-lg 
              transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700
              z-10 hidden lg:flex
              ${isRTL ? "-left-3" : "-right-3"}
            `}
          >
            {collapsed ? (
              isRTL ? (
                <ChevronLeft className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )
            ) : isRTL ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </button>
        )}

        {/* Navigation */}
        <nav aria-label={isRTL ? "التنقل الرئيسي" : "Main navigation"} className="flex-1 mt-4 px-3 overflow-y-auto overscroll-contain max-h-[calc(100vh-8rem)]">
          <ul className="space-y-1 pb-4">{renderMenuItems(menuItems)}</ul>
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-3 text-red-600 dark:text-red-400 
              hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors
              touch-manipulation min-h-[48px] ${rowClass}`}
            title={collapsed && !isMobile ? "Logout" : undefined}
          >
            <LogOut
              className={`w-5 h-5 shrink-0 ${
                collapsed && !isMobile ? "" : isRTL ? "ml-3" : "mr-3"
              }`}
            />
            {(!collapsed || isMobile) && (
              <span className="text-sm font-medium truncate">
                {isRTL ? "تسجيل خروج" : "Logout"}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ModernSidebar;
