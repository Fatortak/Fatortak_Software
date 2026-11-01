import React, { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Users,
  UserCheck,
  UserX,
  Building,
  Calendar,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useCustomers,
  useDeleteCustomer,
  useCustomer,
  useToggleCustomerActivation,
} from "../hooks/useCustomers";
import { PaginationDto, CustomerFilterDto } from "../types/api";
import { toast } from "react-toastify";
import { useBulkActivateCustomers, useBulkDeleteCustomers } from "@/hooks/useBulkActions";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import CustomerModal from "../components/modals/CustomerModal";
import CustomerUpdateModal from "../components/modals/CustomerUpdateModal";
import EnhancedDeleteDialog from "../components/ui/enhanced-delete-dialog";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { formatDate, formatNumber } from "@/Helpers/localization";
import { useNavigate } from "react-router-dom";

const Clients: React.FC = () => {
  const roleAccess = useRoleAccess();
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<string | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const navigate = useNavigate();

  // Pagination state
  const [pagination, setPagination] = useState<PaginationDto>({
    pageNumber: 1,
    pageSize: 10,
  });

  // Filters - for clients, we want customers where isSupplier is false
  const filters: CustomerFilterDto = {
    ...(searchTerm && { name: searchTerm }),
    isSupplier: false, // Only fetch clients (non-suppliers)
  };

  // Fetch customers (clients only)
  const {
    data: customersResponse,
    isLoading,
    error,
    refetch,
  } = useCustomers(pagination, filters);

  // Fetch individual customer for editing
  const { data: editCustomerResponse, isLoading: isLoadingEditCustomer } =
    useCustomer(editCustomerId || "");

  const deleteCustomerMutation = useDeleteCustomer();
  const toggleActivationMutation = useToggleCustomerActivation();
  const bulkDeleteMutation = useBulkDeleteCustomers();
  const bulkActivateMutation = useBulkActivateCustomers();

  // Filter only clients (non-suppliers) on the frontend for now
  const allCustomers = customersResponse?.success
    ? customersResponse.data?.data || []
    : [];

  // For now, we'll show all customers as clients since isSupplier field doesn't exist yet
  const customers = allCustomers;
  const totalCount = customers.length;

  const editCustomer = editCustomerResponse?.success
    ? editCustomerResponse.data
    : null;

  const clientsStats = customersResponse?.success
    ? customersResponse.data?.metaData || {}
    : {};

  const stats = {
    total: clientsStats.total || 0,
    active: clientsStats.active || 0,
    inactive: clientsStats.inactive || 0,
    recent: clientsStats.recent || 0,
  };

  const handleNewCustomer = () => {
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customerId: string) => {
    setEditCustomerId(customerId);
  };

  const handleDeleteCustomer = (customerId: string) => {
    setDeleteCustomerId(customerId);
  };

  const handleViewProjects = (id: string, name: string) => {
    navigate(`/projects?clientId=${id}`);
  };

  const handleToggleActivation = async (customerId: string) => {
    try {
      const result = await toggleActivationMutation.mutateAsync(customerId);

      if (result.success) {
        toast.success(
          isRTL
            ? "تم تحديث حالة العميل بنجاح"
            : "Customer status updated successfully",
        );
        refetch();
      }
    } catch (error) {
      toast.error(
        isRTL ? "فشل في تحديث حالة العميل" : "Failed to update customer status",
      );
    }
  };

  const toggleSelected = (customerId: string) => {
    setSelectedIds((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === customers.length ? [] : customers.map((customer: any) => customer.id)
    );
  };

  const runBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const result = await bulkDeleteMutation.mutateAsync(selectedIds);
      toast.success(
        isRTL
          ? `تم حذف ${result.data?.affected || 0} عميل`
          : `${result.data?.affected || 0} customer(s) deleted`
      );
      setSelectedIds([]);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not delete selected customers");
    }
  };

  const runBulkActivate = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      const result = await bulkActivateMutation.mutateAsync({
        ids: selectedIds,
        isActive,
      });
      toast.success(
        isRTL
          ? `تم تحديث ${result.data?.affected || 0} عميل`
          : `${result.data?.affected || 0} customer(s) updated`
      );
      setSelectedIds([]);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not update selected customers");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCustomerId) return;


    try {
      const result = await deleteCustomerMutation.mutateAsync(deleteCustomerId);

      if (result.success) {
        toast.success(
          isRTL ? "تم حذف العميل بنجاح" : "Customer deleted successfully",
        );
        setDeleteCustomerId(null);
        refetch();
      }
    } catch (error) {
      toast.error(isRTL ? "فشل في حذف العميل" : "Failed to delete customer");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, pageNumber: newPage }));
  };

  const generateAvatar = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const initial = name.charAt(0).toUpperCase();
    const colorIndex = name.charCodeAt(0) % colors.length;
    return { initial, color: colors[colorIndex] };
  };

  if (error) {
    return (
      <div className="min-h-screen bg-canvas dark:bg-slate-950">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-destructive mb-2">
                {isRTL ? "خطأ في تحميل العملاء" : "Error Loading Clients"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {error instanceof Error
                  ? error.message
                  : "Unknown error occurred"}
              </p>
              <Button onClick={() => refetch()} className="w-full">
                {isRTL ? "إعادة المحاولة" : "Retry"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950">
      <div className="container !max-w-full mx-auto p-4 space-y-6">
        {/* Enhanced Header */}
        <div className="page-hero">
          <div
            className={`flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 ${
              isRTL ? "lg:flex-row-reverse" : ""
            }`}
          >
            <div className={`flex items-center space-x-4`}>
              <div className="page-hero-icon mx-3">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {isRTL ? "العملاء" : "Clients"}
                </h1>
                <p className="text-blue-100 text-lg">
                  {isRTL
                    ? "إدارة جميع عملائك بسهولة"
                    : "Manage all your clients with ease"}
                </p>
              </div>
            </div>

            {roleAccess.canCreate() && (
              <Button
                onClick={handleNewCustomer}
                className="page-hero-action"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="font-semibold">
                  {isRTL ? "إضافة عميل جديد" : "Add New Client"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200/80 bg-white transition-colors hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {isRTL ? "إجمالي العملاء" : "Total Clients"}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatNumber(stats?.total)}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/40">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white transition-colors hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {isRTL ? "العملاء النشطون" : "Active Clients"}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatNumber(stats.active)}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                  <UserCheck className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white transition-colors hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {isRTL ? "العملاء غير النشطين" : "Inactive Clients"}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatNumber(stats.inactive)}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white transition-colors hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {isRTL ? "عملاء جدد" : "New Clients"}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatNumber(stats.recent)}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search */}
        <Card className="border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="relative">
              <Search
                className={`absolute top-1/2 transform -translate-y-1/2 ${
                  isRTL ? "right-4" : "left-4"
                } w-5 h-5 text-muted-foreground`}
              />
              <input
                type="text"
                placeholder={
                  isRTL ? "البحث في العملاء..." : "Search clients..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full py-3 px-4 ${
                  isRTL ? "pr-12 text-end" : "pl-12"
                } border rounded-xl bg-background/60 backdrop-blur-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Customers Display */}
        {!isLoading && (
          <Card className="border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-slate-800 dark:bg-slate-900">
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-brand-50/60 px-4 py-3 dark:border-slate-800 dark:bg-brand-950/20">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {isRTL
                    ? `تم تحديد ${selectedIds.length}`
                    : `${selectedIds.length} selected`}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runBulkActivate(true)}
                    loading={bulkActivateMutation.isPending}
                  >
                    <UserCheck className="h-4 w-4" />
                    {isRTL ? "تفعيل" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runBulkActivate(false)}
                    loading={bulkActivateMutation.isPending}
                  >
                    <UserX className="h-4 w-4" />
                    {isRTL ? "تعطيل" : "Deactivate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={runBulkDelete}
                    loading={bulkDeleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                    {isRTL ? "حذف" : "Delete"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                    {isRTL ? "إلغاء التحديد" : "Clear"}
                  </Button>
                </div>
              </div>
            )}
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50/80 dark:bg-slate-800/60">
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-brand-600"
                          checked={customers.length > 0 && selectedIds.length === customers.length}
                          onChange={toggleSelectAll}
                          aria-label={isRTL ? "تحديد الكل" : "Select all"}
                        />
                      </th>
                      <th
                        className={`px-4 py-3 text-${
                          isRTL ? "right" : "left"
                        } text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400`}
                      >
                        {t("customer")}
                      </th>
                      <th
                        className={`px-4 py-3 text-${
                          isRTL ? "right" : "left"
                        } text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400`}
                      >
                        {t("contact")}
                      </th>
                      <th
                        className={`px-4 py-3 text-${
                          isRTL ? "right" : "left"
                        } text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400`}
                      >
                        {t("address")}
                      </th>
                      <th
                        className={`px-4 py-3 text-${
                          isRTL ? "right" : "left"
                        } text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400`}
                      >
                        {t("status")}
                      </th>
                      <th
                        className={`px-4 py-3 text-${
                          isRTL ? "right" : "left"
                        } text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400`}
                      >
                        {t("joinedDate")}
                      </th>
                      <th
                        className={`px-4 py-3 text-${
                          isRTL ? "right" : "left"
                        } text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400`}
                      >
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {customers.map((customer: any) => {
                      const avatar = generateAvatar(customer.name);
                      return (
                        <tr
                          key={customer?.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-brand-600"
                              checked={selectedIds.includes(customer.id)}
                              onChange={() => toggleSelected(customer.id)}
                              aria-label={isRTL ? "تحديد العميل" : "Select customer"}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-10 h-10 rounded-full ${avatar.color} flex items-center justify-center text-white font-semibold`}
                              >
                                {avatar.initial}
                              </div>
                              <div>
                                <div className="font-semibold">
                                  {customer?.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {customer?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {customer.phone && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  <span>{customer.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span>{customer.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{customer.address || t("noAddress")}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div dir={isRTL ? "rtl" : "ltr"}>
                                <Switch
                                  dir={isRTL ? "rtl" : "ltr"}
                                  checked={customer.isActive}
                                  onCheckedChange={() =>
                                    handleToggleActivation(customer.id)
                                  }
                                  disabled={
                                    toggleActivationMutation.isPending ||
                                    !roleAccess.canToggleActivation()
                                  }
                                />
                              </div>
                              <Badge
                                variant={
                                  customer.isActive ? "default" : "secondary"
                                }
                                className={`${
                                  customer.isActive
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"
                                    : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                                } border`}
                              >
                                {customer.isActive
                                  ? t("active")
                                  : t("inactive")}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(customer.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1">
                              {roleAccess.canEdit() && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleEditCustomer(customer.id)
                                  }
                                  className="text-primary hover:text-primary/80"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleViewProjects(customer.id, customer.name)
                                }
                                className="text-emerald-600 hover:text-emerald-800"
                                title={isRTL ? "عرض المشاريع" : "View Projects"}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {roleAccess.canCreate() && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/projects/new-with-contract?clientId=${customer.id}`,
                                    )
                                  }
                                  className="text-indigo-600 hover:text-indigo-800"
                                  title={
                                    isRTL ? "إنشاء مشروع" : "Create Project"
                                  }
                                >
                                  <Briefcase className="w-4 h-4" />
                                </Button>
                              )}
                              {roleAccess.canDelete() && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteCustomer(customer.id)
                                  }
                                  className="text-destructive hover:text-destructive/80"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-border/50">
              {customers.map((customer: any) => {
                const avatar = generateAvatar(customer.name);
                return (
                  <div key={customer.id} className="p-4 space-y-4">
                    <div
                      className={`flex items-start justify-between ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-full ${avatar.color} flex items-center justify-center text-white font-semibold`}
                        >
                          {avatar.initial}
                        </div>
                        <div>
                          <h3 className="font-semibold">{customer.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          dir={isRTL ? "rtl" : "ltr"}
                          style={{
                            direction: isRTL ? "rtl" : "ltr",
                          }}
                          checked={customer.isActive}
                          onCheckedChange={() =>
                            handleToggleActivation(customer.id)
                          }
                          disabled={
                            toggleActivationMutation.isPending ||
                            !roleAccess.canToggleActivation()
                          }
                        />
                        <Badge
                          variant={customer.isActive ? "default" : "secondary"}
                          className={`${
                            customer.isActive
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                          } border`}
                        >
                          {customer.isActive ? t("active") : t("inactive")}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm">
                      {customer.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{customer.address || "No address"}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(customer.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCustomer(customer.id)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        {t("edit")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleViewProjects(customer.id, customer.name)
                        }
                        className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {isRTL ? "مشاريع" : "Projects"}
                      </Button>
                      {roleAccess.canCreate() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/projects/new-with-contract?clientId=${customer.id}`,
                            )
                          }
                          className="flex-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                          <Briefcase className="w-3 h-3 mr-1" />
                          {isRTL ? "مشروع" : "Project"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Pagination */}
            <div className="border-t bg-muted/20 px-4 py-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {isRTL
                    ? `عرض ${formatNumber(customers.length)} من ${formatNumber(totalCount)} عملاء`
                    : `Showing ${formatNumber(customers.length)} of ${formatNumber(totalCount)} customers`}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.pageNumber - 1)}
                    disabled={pagination.pageNumber <= 1}
                  >
                    {isRTL ? "السابق" : "Previous"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.pageNumber + 1)}
                    disabled={customers.length < pagination.pageSize}
                  >
                    {isRTL ? "التالي" : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced Empty State */}
        {!isLoading && customers.length === 0 && (
          <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {isRTL ? "لا يوجد عملاء" : "No clients found"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {isRTL
                  ? "ابدأ بإضافة عميل جديد"
                  : "Get started by adding a new client"}
              </p>
              <Button
                onClick={handleNewCustomer}
                className="bg-brand-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isRTL ? "إضافة أول عميل" : "Add First Client"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isSupplier={false}
        isOpen={isModalOpen}
        onSuccess={() => {
          setIsModalOpen(false);
          refetch();
        }}
        onClose={() => setIsModalOpen(false)}
      />

      {editCustomerId && editCustomer && !isLoadingEditCustomer && (
        <CustomerUpdateModal
          customer={editCustomer}
          onSave={() => {
            setEditCustomerId(null);
            refetch();
          }}
          onClose={() => setEditCustomerId(null)}
        />
      )}

      <EnhancedDeleteDialog
        isOpen={!!deleteCustomerId}
        onClose={() => setDeleteCustomerId(null)}
        onConfirm={handleConfirmDelete}
        title={isRTL ? "حذف العميل" : "Delete Client"}
        description={t("confirmDeleteClient")}
        itemName={
          customers.find((customer) => customer.id === deleteCustomerId)?.name
        }
        isLoading={deleteCustomerMutation.isPending}
      />
    </div>
  );
};

export default Clients;
