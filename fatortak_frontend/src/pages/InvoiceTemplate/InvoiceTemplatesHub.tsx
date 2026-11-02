import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  LayoutTemplate,
  Receipt,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import TemplatePreview from "@/components/invoice-templates/TemplatePreview";
import { useCurrentCompany } from "@/hooks/useCompanies";
import { useLanguage } from "@/contexts/LanguageContext";

const templates = [
  { id: "modern-gradient", name: "Modern Gradient", nameAr: "تدرج حديث", tone: "from-violet-600 to-indigo-600" },
  { id: "classic-professional", name: "Classic Professional", nameAr: "كلاسيكي احترافي", tone: "from-blue-600 to-indigo-600" },
  { id: "minimalist-clean", name: "Minimalist Clean", nameAr: "بسيط ونظيف", tone: "from-slate-700 to-slate-500" },
  { id: "bold-corporate", name: "Bold Corporate", nameAr: "مؤسسي جريء", tone: "from-orange-600 to-red-600" },
  { id: "elegant-script", name: "Elegant Script", nameAr: "أنيق بخط راقٍ", tone: "from-pink-600 to-purple-600" },
  { id: "tech-modern", name: "Tech Modern", nameAr: "تقني حديث", tone: "from-cyan-600 to-blue-600" },
];

const InvoiceTemplatesHub = () => {
  const { isRTL } = useLanguage();
  const { data: companyResult } = useCurrentCompany();
  const company = companyResult?.data;
  const saleTemplate = company?.saleInvoiceTemplate || "modern-gradient";
  const buyTemplate = company?.purchaseInvoiceTemplate || "modern-gradient";

  return (
    <div
      className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <PageHeader
        eyebrow={isRTL ? "الهوية البصرية" : "Invoice identity"}
        title={isRTL ? "قوالب الفواتير" : "Invoice templates"}
        description={
          isRTL
            ? "اختر تصميماً واحداً للبيع وآخر للشراء، وعاين النتيجة قبل الحفظ. كل القوالب تدعم العربية وRTL والطباعة."
            : "Choose one design for sales and one for purchases, preview it before saving. Every template supports Arabic, RTL and print."
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {[
          {
            title: isRTL ? "قالب فواتير البيع" : "Sales invoice template",
            description: isRTL
              ? "يظهر للعميل في الفاتورة المطبوعة والرابط العام."
              : "Shown to customers in print and the public invoice link.",
            icon: Receipt,
            template: saleTemplate,
            color: company?.saleInvoiceTemplateColor || "professional-dark",
            path: "/invoice-templates/sell",
            accent: "from-emerald-500 to-teal-600",
          },
          {
            title: isRTL ? "قالب فواتير الشراء" : "Purchase invoice template",
            description: isRTL
              ? "يُستخدم لفواتير الموردين والمستندات الداخلية."
              : "Used for supplier bills and internal purchase documents.",
            icon: ShoppingCart,
            template: buyTemplate,
            color: company?.purchaseInvoiceTemplateColor || "professional-dark",
            path: "/invoice-templates/buy",
            accent: "from-orange-500 to-amber-600",
          },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-800"
          >
            <div className={`flex items-center justify-between bg-gradient-to-r ${item.accent} px-5 py-4 text-white`}>
              <div className="flex items-center gap-2">
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-semibold">{item.title}</span>
              </div>
              <ArrowUpRight className="h-4 w-4 opacity-80" />
            </div>
            <div className="p-5">
              <div className="mb-4 h-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700">
                <TemplatePreview
                  templateId={item.template}
                  companyLogo={company?.logoUrl}
                  selectedColor={item.color}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <CheckCircle2 className="me-1 h-3 w-3 text-emerald-600" />
                  {item.template.replace(/-/g, " ")}
                </Badge>
                <span className="text-xs text-slate-400">
                  {item.color.replace(/-/g, " ")}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {item.description}
              </p>
              <span className="mt-3 inline-flex text-sm font-semibold text-brand-700 dark:text-brand-300">
                {isRTL ? "تخصيص ومعاينة" : "Customize and preview"}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <LayoutTemplate className="h-5 w-5 text-brand-600" />
                {isRTL ? "كل التصاميم" : "All designs"}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isRTL
                  ? "ستة تصاميم مدروسة، وكلها قابلة للتخصيص بنفس محرر المعاينة."
                  : "Six considered designs, all customizable in the same preview editor."}
              </p>
            </div>
            <Badge className="border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">
              <Sparkles className="me-1 h-3 w-3" />
              6 {isRTL ? "تصاميم" : "designs"}
            </Badge>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => {
              const isCurrent =
                template.id === saleTemplate || template.id === buyTemplate;
              return (
                <Link
                  key={template.id}
                  to="/invoice-templates/sell"
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-brand-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className={`flex items-center justify-between bg-gradient-to-r ${template.tone} px-3 py-2 text-white`}>
                    <span className="text-xs font-semibold">
                      {isRTL ? template.nameAr : template.name}
                    </span>
                    {isCurrent && (
                      <Badge className="border-white/30 bg-white/20 text-[10px] text-white">
                        {isRTL ? "مستخدم" : "In use"}
                      </Badge>
                    )}
                  </div>
                  <div className="h-32 p-3">
                    <TemplatePreview
                      templateId={template.id}
                      companyLogo={company?.logoUrl}
                      selectedColor="professional-dark"
                    />
                  </div>
                  <div className="border-t border-slate-100 px-3 py-2 text-xs font-medium text-slate-500 group-hover:text-brand-700 dark:border-slate-800 dark:text-slate-400 dark:group-hover:text-brand-300">
                    {isRTL ? "معاينة وتخصيص" : "Preview and customize"}
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceTemplatesHub;
