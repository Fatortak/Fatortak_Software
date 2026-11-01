import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Rocket,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useOnboarding, useSeedDemoData } from "@/hooks/useOnboarding";

const Onboarding: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const navigate = useNavigate();
  const { data: response, isLoading } = useOnboarding();
  const seedMutation = useSeedDemoData();
  const progress = response?.success ? response.data : undefined;

  const seed = async () => {
    try {
      const result = await seedMutation.mutateAsync();
      toast.success(
        result.data?.alreadyLoaded
          ? isRTL
            ? "بيانات التجربة موجودة بالفعل"
            : "Demo data is already loaded"
          : isRTL
            ? "تم إنشاء بيانات التجربة"
            : "Demo data created"
      );
    } catch (error: any) {
      toast.error(error?.message || "Could not create demo data");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "البداية" : "Getting started"}
        title={isRTL ? "جهّز مساحة العمل" : "Set up your workspace"}
        description={
          isRTL
            ? "أكمل الخطوات الأساسية للانتقال من الحساب الجديد إلى أول دورة بيع."
            : "Complete the essential steps from a new account to your first quote-to-cash cycle."
        }
      />

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            {isRTL ? "جارٍ التحميل..." : "Loading progress..."}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden border-brand-100 bg-gradient-to-br from-brand-50/80 to-white dark:border-brand-900 dark:from-brand-950/30 dark:to-slate-900">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isRTL ? "التقدم" : "Progress"}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {progress?.percent || 0}%{" "}
                      <span className="text-sm font-normal text-slate-500">
                        {progress?.completed || 0}/{progress?.total || 0}
                      </span>
                    </p>
                  </div>
                </div>
                <Badge className="border-brand-100 bg-white text-brand-700 dark:border-brand-900 dark:bg-slate-900 dark:text-brand-300">
                  {progress?.demoDataLoaded
                    ? isRTL ? "بيانات تجربة محمّلة" : "Demo data loaded"
                    : isRTL ? "بيانات حقيقية" : "Your own data"}
                </Badge>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all"
                  style={{ width: `${progress?.percent || 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {progress?.steps.map((step) => (
              <div
                key={step.key}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
                  )}
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {step.title}
                      {step.completed && (
                        <Badge className="ms-2 border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {isRTL ? "مكتمل" : "Done"}
                        </Badge>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {step.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant={step.completed ? "ghost" : "outline"}
                  size="sm"
                  onClick={() => navigate(step.route)}
                >
                  {step.completed
                    ? isRTL ? "مراجعة" : "Review"
                    : isRTL ? "ابدأ" : "Open"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {roleAccess.isAdmin() && (
            <Card className="border-dashed border-slate-300 dark:border-slate-700">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {isRTL ? "جرّب النظام ببيانات تجريبية" : "Explore with demo data"}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {isRTL
                        ? "ينشئ عملاء وموردين وأصنافاً ومشروعاً وعرض سعر مسودة. لن يلمس بياناتك الحالية."
                        : "Creates demo customers, suppliers, items, a project and a draft quotation. Your existing data is untouched."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={seed}
                  loading={seedMutation.isPending}
                  disabled={progress?.demoDataLoaded}
                >
                  <Sparkles className="h-4 w-4" />
                  {progress?.demoDataLoaded
                    ? isRTL ? "محمّلة مسبقاً" : "Already loaded"
                    : isRTL ? "إنشاء بيانات تجربة" : "Create demo data"}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Onboarding;
