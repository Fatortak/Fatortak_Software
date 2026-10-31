import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthGuard from "./components/AuthGuard";
import MainLayout from "./components/Layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SellInvoices from "./pages/SellInvoices";
import BuyInvoices from "./pages/BuyInvoices";
import Quotations from "./pages/Quotations";
import SalesOrders from "./pages/SalesOrders";
import PurchaseRequisitions from "./pages/PurchaseRequisitions";
import DeliveryNotes from "./pages/DeliveryNotes";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Suppliers from "./pages/Suppliers";
import Items from "./pages/Items";
import Expenses from "./pages/Expenses";

import TrialBalance from "./pages/Reports/TrialBalance";
import GeneralLedger from "./pages/Reports/GeneralLedger";
import IncomeStatement from "./pages/Reports/IncomeStatement";
import BalanceSheet from "./pages/Reports/BalanceSheet";
import CashFlowReport from "./pages/Reports/CashFlowReport";
import ARAging from "./pages/Reports/ARAging";
import APAging from "./pages/Reports/APAging";
import CustomerStatement from "./pages/Reports/CustomerStatement";
import VendorStatement from "./pages/Reports/VendorStatement";
import SalesReport from "./pages/Reports/SalesReport";
import ProjectProfitability from "./pages/Reports/ProjectProfitability";
import ProjectCostBreakdown from "./pages/Reports/ProjectCostBreakdown";
import CashBankReport from "./pages/Reports/CashBankReport";
import ReportsHub from "./pages/Reports/ReportsHub";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import AIChat from "./pages/AIChat";
import SubscriptionPlansPage from "./pages/SubscriptionPlansPage";
import NotFound from "./pages/NotFound";
import SubscriptionRequiredModal from "./components/modals/SubscriptionRequiredModal";
import { useSubscriptionModal } from "./hooks/useSubscriptionModal";
import { apiClient } from "./services/api";
import "./App.css";
import PaymentPage from "./pages/PaymentPage";
import PublicInvoicePage from "./pages/PublicInvoicePage";
import Notifications from "./pages/Notifications";
import Register from "./pages/Register";
import Welcome from "./pages/Welcome";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Attendances from "./pages/Attendances";
import OcrInvoicePage from "./pages/Ai/OcrInvoicePage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DailyAttendanceReport from "./pages/DailyAttendanceReport";
import MonthlyAttendanceReport from "./pages/MonthlyAttendanceReport";
import Payroll from "./pages/Payroll";
import InvoiceTemplateDemo from "./pages/InvoiceTemplate/InvoiceTemplateDemo";


// 🆕 NEW IMPORTS - Stock Reports

import ChartOfAccounts from "./pages/ChartOfAccounts";
import Cheques from "./pages/Cheques";
import JournalEntries from "./pages/JournalEntries";
import Stakeholders from "./pages/Stakeholders";
import InstallationInsights from "./pages/InstallationInsights";
import InvoiceTemplatesHub from "./pages/InvoiceTemplate/InvoiceTemplatesHub";

import ExpenseCategories from "./pages/ExpenseCategories";
import Custody from "./pages/Custody";
import CreateProjectWithContractForm from "./pages/CreateProjectWithContractForm";
import EditProjectWithContractForm from "./pages/EditProjectWithContractForm";
import ProjectDetails from "./pages/ProjectDetails";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // data becomes stale immediately
      gcTime: 0, // (old name: cacheTime) delete cached data immediately
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true, // always refetch when component mounts
      retry: false,
      enabled: true,
    },
    mutations: {
      retry: false,
    },
  },
});

function AppContent() {
  const {
    showSubscriptionModal,
    handleSubscriptionRequired,
    closeSubscriptionModal,
    handleViewPlans,
  } = useSubscriptionModal();

  useEffect(() => {
    apiClient.setSubscriptionRequiredHandler(handleSubscriptionRequired);
  }, [handleSubscriptionRequired]);

  const { isRTL } = useLanguage();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/welcome"
          element={
            <AuthGuard>
              <Welcome />
            </AuthGuard>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/invoice/:invoiceId/:invoiceTemplate?/:invoiceTemplateColor?"
          element={<PublicInvoicePage />}
        />

        <Route
          path="/"
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sell-invoices" element={<SellInvoices />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="sales-orders" element={<SalesOrders />} />
          <Route path="purchase-requisitions" element={<PurchaseRequisitions />} />
          <Route path="delivery-notes" element={<DeliveryNotes />} />
          <Route path="buy-invoices" element={<BuyInvoices />} />
          <Route path="clients" element={<Clients />} />
           <Route path="items" element={<Items />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="projects/new-with-contract" element={<CreateProjectWithContractForm />} />
          <Route path="projects/edit-with-contract/:id" element={<EditProjectWithContractForm />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
          <Route path="expense-categories" element={<ExpenseCategories />} />
          <Route path="journal-entries" element={<JournalEntries />} />
          <Route path="stakeholders" element={<Stakeholders />} />
          <Route path="cheques" element={<Cheques />} />
          <Route path="custody" element={<Custody />} />

          {/* Revamped Reports */}
          <Route path="reports" element={<ReportsHub />} />
          <Route path="reports-group" element={<ReportsHub />} />

          <Route path="reports/trial-balance" element={<TrialBalance />} />
          <Route path="reports/ledger" element={<GeneralLedger />} />
          <Route path="reports/income-statement" element={<IncomeStatement />} />
          <Route path="reports/balance-sheet" element={<BalanceSheet />} />
          <Route path="reports/cash-flow" element={<CashFlowReport />} />
          <Route path="reports/cash-bank-movements" element={<CashBankReport />} />
          <Route path="reports/ar-aging" element={<ARAging />} />
          <Route path="reports/ap-aging" element={<APAging />} />
          <Route path="reports/customer-statement" element={<CustomerStatement />} />
          <Route path="reports/vendor-statement" element={<VendorStatement />} />
          <Route path="reports/sales" element={<SalesReport />} />
          <Route path="reports/project-profitability" element={<ProjectProfitability />} />
          <Route path="reports/project-cost-breakdown" element={<ProjectCostBreakdown />} />
          <Route path="expenses" element={<Expenses />} />


          {/* 🆕 NEW ROUTES - Stock Reports */}

          <Route path="team" element={<Team />} />
          <Route path="settings" element={<Settings />} />
          <Route path="installation" element={<InstallationInsights />} />
          <Route path="employees" element={<Employees />} />
          <Route path="departments" element={<Departments />} />
          <Route path="attendances" element={<Attendances />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="daily-attendance" element={<DailyAttendanceReport />} />
          <Route
            path="monthly-attendance"
            element={<MonthlyAttendanceReport />}
          />
          <Route path="profile" element={<UserProfile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="ai-chat" element={<AIChat />} />
          <Route path="ocr-invoice" element={<OcrInvoicePage />} />
          <Route path="invoice-templates" element={<InvoiceTemplatesHub />} />
          <Route
            path="invoice-templates/:invoiceType"
            element={<InvoiceTemplateDemo />}
          />
          <Route
            path="subscription-plans"
            element={<SubscriptionPlansPage />}
          />
          <Route path="payment" element={<PaymentPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>

      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={closeSubscriptionModal}
        onViewPlans={handleViewPlans}
      />
      <ToastContainer rtl={isRTL} />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <AppContent />
            </Router>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
