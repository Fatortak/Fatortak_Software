import React from "react";
import {
  Globe,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useRevokeOtherSessions,
  useRevokeSession,
  useUserSessions,
} from "@/hooks/useSessions";

const Sessions: React.FC = () => {
  const { isRTL } = useLanguage();
  const { data: response, isLoading, refetch } = useUserSessions();
  const revokeMutation = useRevokeSession();
  const revokeOthersMutation = useRevokeOtherSessions();

  const sessions = response?.success ? response.data || [] : [];
  const active = sessions.filter((session) => session.isActive);
  const current = sessions.find((session) => session.isCurrent);

  const revoke = async (id: string, isCurrent: boolean) => {
    try {
      await revokeMutation.mutateAsync(id);
      toast.success(isRTL ? "تم إلغاء الجلسة" : "Session revoked");
      if (isCurrent) {
        window.location.assign("/login");
        return;
      }
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not revoke session");
    }
  };

  const revokeOthers = async () => {
    try {
      const result = await revokeOthersMutation.mutateAsync();
      toast.success(
        isRTL
          ? `تم إنهاء ${result.data || 0} جلسة أخرى`
          : `${result.data || 0} other session(s) signed out`
      );
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Could not revoke other sessions");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "الأمان" : "Security"}
        title={isRTL ? "الجلسات والأجهزة" : "Sessions and devices"}
        description={
          isRTL
            ? "راجع الأجهزة التي سجلت الدخول وأنهِ الجلسات غير المعروفة."
            : "Review devices that signed in and end any sessions you do not recognize."
        }
        actions={
          <Button
            variant="outline"
            onClick={revokeOthers}
            loading={revokeOthersMutation.isPending}
            disabled={active.filter((session) => !session.isCurrent).length === 0}
          >
            <LogOut className="h-4 w-4" />
            {isRTL ? "إنهاء الجلسات الأخرى" : "Sign out other sessions"}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={isRTL ? "الجلسات النشطة" : "Active sessions"} value={active.length} subtitle={isRTL ? "صالحة الآن" : "Currently valid"} icon={MonitorSmartphone} tone="brand" />
        <StatCard title={isRTL ? "كل الجلسات" : "All sessions"} value={sessions.length} subtitle={isRTL ? "آخر 100 جلسة" : "Last 100 sessions"} icon={ShieldCheck} tone="info" />
        <StatCard title={isRTL ? "الجهاز الحالي" : "This device"} value={current?.deviceLabel || "-"} subtitle={current?.ipAddress || (isRTL ? "غير معروف" : "Unknown IP")} icon={Smartphone} tone="success" />
        <StatCard title={isRTL ? "الموقع" : "Location"} value={current?.tenantName || "-"} subtitle={isRTL ? "مساحة العمل" : "Workspace"} icon={Globe} tone="warning" />
      </div>

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            {isRTL ? "جارٍ التحميل..." : "Loading sessions..."}
          </CardContent>
        ) : sessions.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              <MonitorSmartphone className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isRTL ? "لا توجد جلسات مسجلة" : "No recorded sessions"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {isRTL
                ? "ستظهر الجلسات هنا بعد تسجيل الدخول."
                : "Sessions will appear here after signing in."}
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? "الجهاز" : "Device"}</TableHead>
                <TableHead>{isRTL ? "عنوان IP" : "IP address"}</TableHead>
                <TableHead>{isRTL ? "مساحة العمل" : "Workspace"}</TableHead>
                <TableHead>{isRTL ? "آخر نشاط" : "Last active"}</TableHead>
                <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                <TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MonitorSmartphone className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {session.deviceLabel}
                          {session.isCurrent && (
                            <Badge className="ms-2 border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">
                              {isRTL ? "هذا الجهاز" : "This device"}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(session.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {session.ipAddress || "-"}
                  </TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400">
                    {session.tenantName || "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {new Date(session.lastSeenAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        session.isActive
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }
                    >
                      {session.isActive
                        ? isRTL ? "نشطة" : "Active"
                        : isRTL ? "منتهية" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      {session.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revoke(session.id, session.isCurrent)}
                          loading={revokeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                          {session.isCurrent
                            ? isRTL ? "خروج" : "Sign out"
                            : isRTL ? "إنهاء" : "Revoke"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Sessions;
