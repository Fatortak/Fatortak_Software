import React from "react";
import { ArrowRight, Check, Eye, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TemplatePreview from "@/components/invoice-templates/TemplatePreview";

const colorOptions = [
  { id: "professional-dark", name: "Professional Dark", nameAr: "احترافي داكن", value: "rgb(30, 41, 59)", gradient: "from-slate-800 to-slate-900" },
  { id: "professional-white", name: "Professional White", nameAr: "احترافي فاتح", value: "rgb(248, 250, 252)", gradient: "from-slate-50 to-slate-200" },
  { id: "elegant-gray", name: "Elegant Gray", nameAr: "رمادي أنيق", value: "rgb(71, 85, 105)", gradient: "from-slate-600 to-slate-700" },
  { id: "royal-blue", name: "Royal Blue", nameAr: "أزرق ملكي", value: "rgb(37, 99, 235)", gradient: "from-blue-600 to-blue-700" },
  { id: "deep-navy", name: "Deep Navy", nameAr: "كحلي عميق", value: "rgb(30, 58, 138)", gradient: "from-blue-900 to-blue-950" },
  { id: "forest-green", name: "Forest Green", nameAr: "أخضر غامق", value: "rgb(21, 128, 61)", gradient: "from-green-700 to-green-800" },
];

const templates = [
  {
    id: "modern-gradient",
    name: "Modern Gradient",
    nameAr: "تدرج حديث",
    description: "Bold gradients and a contemporary layout for modern brands.",
    descriptionAr: "تدرجات لونية جريئة وتصميم عصري يناسب العلامات الحديثة.",
    tone: "from-violet-600 to-indigo-600",
  },
  {
    id: "classic-professional",
    name: "Classic Professional",
    nameAr: "كلاسيكي احترافي",
    description: "Traditional business structure with confident typography.",
    descriptionAr: "هيكل أعمال تقليدي مع تنسيق طباعي واثق.",
    tone: "from-blue-600 to-indigo-600",
  },
  {
    id: "minimalist-clean",
    name: "Minimalist Clean",
    nameAr: "بسيط ونظيف",
    description: "Quiet, spacious and focused on the numbers.",
    descriptionAr: "هادئ وواسع ويركز على الأرقام.",
    tone: "from-slate-700 to-slate-500",
  },
  {
    id: "bold-corporate",
    name: "Bold Corporate",
    nameAr: "مؤسسي جريء",
    description: "Strong headers and high-contrast totals for formal invoices.",
    descriptionAr: "رؤوس قوية وإجماليات عالية التباين للفواتير الرسمية.",
    tone: "from-orange-600 to-red-600",
  },
  {
    id: "elegant-script",
    name: "Elegant Script",
    nameAr: "أنيق بلمسة خطية",
    description: "Refined serif details for premium services.",
    descriptionAr: "تفاصيل خطية راقية للخدمات المميزة.",
    tone: "from-pink-600 to-purple-600",
  },
  {
    id: "tech-modern",
    name: "Tech Modern",
    nameAr: "تقني حديث",
    description: "Clean grids and structured data for technology teams.",
    descriptionAr: "شبكات نظيفة وبيانات منظمة لفرق التقنية.",
    tone: "from-cyan-600 to-blue-600",
  },
];

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  onPreview?: () => void;
  selectedTemplate?: string;
  isRTL?: boolean;
  t?: (key: string) => string;
  companyLogo?: string;
  onSelectColor?: (colorId: string) => void;
  selectedColor?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onPreview,
  selectedTemplate = "modern-gradient",
  isRTL = false,
  companyLogo,
  onSelectColor = () => {},
  selectedColor = "professional-dark",
}) => {
  const selected =
    templates.find((template) => template.id === selectedTemplate) || templates[0];
  const selectedColorOption =
    colorOptions.find((color) => color.id === selectedColor) || colorOptions[0];

  return (
    <div
      className="min-h-screen bg-canvas p-4 sm:p-6 dark:bg-slate-950"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Palette className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
                {isRTL ? "الهوية البصرية" : "Invoice identity"}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {isRTL ? "قوالب الفواتير" : "Invoice templates"}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                {isRTL
                  ? "اختر التصميم واللون، ثم عاين الفاتورة كاملة قبل الحفظ."
                  : "Choose a design and colour, then preview the full invoice before saving."}
              </p>
            </div>
          </div>
          <Badge className="border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">
            <Sparkles className="me-1 h-3 w-3" />
            {templates.length} {isRTL ? "تصاميم" : "designs"}
          </Badge>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const active = selectedTemplate === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onSelectTemplate(template.id)}
                  className={`group overflow-hidden rounded-2xl border bg-white text-start shadow-sm transition-all dark:bg-slate-900 ${
                    active
                      ? "border-brand-400 ring-2 ring-brand-200 dark:border-brand-700 dark:ring-brand-900"
                      : "border-slate-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-slate-800 dark:hover:border-brand-800"
                  }`}
                >
                  <div className={`relative h-40 bg-gradient-to-br ${template.tone} p-4`}>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                        {isRTL ? "معاينة مباشرة" : "Live preview"}
                      </span>
                      {active && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-900 shadow">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="mx-auto mt-3 h-[105px] w-[78%] overflow-hidden rounded-md bg-white shadow-lg">
                      <div className="h-full w-full scale-[0.95] origin-top">
                        <TemplatePreview
                          templateId={template.id}
                          companyLogo={companyLogo}
                          selectedColor={selectedColor}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {isRTL ? template.nameAr : template.name}
                      </h3>
                      {active && (
                        <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {isRTL ? "محدد" : "Selected"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {isRTL ? template.descriptionAr : template.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {isRTL ? "التحديد الحالي" : "Current selection"}
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {isRTL ? selected.nameAr : selected.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isRTL ? selected.descriptionAr : selected.description}
              </p>

              <div className="mt-5">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Palette className="h-3.5 w-3.5" />
                  {isRTL ? "لون الهوية" : "Brand colour"}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => onSelectColor(color.id)}
                      className={`overflow-hidden rounded-lg border transition ${
                        selectedColor === color.id
                          ? "border-brand-500 ring-2 ring-brand-200 dark:border-brand-600 dark:ring-brand-900"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                      }`}
                      title={isRTL ? color.nameAr : color.name}
                    >
                      <span className={`block h-10 bg-gradient-to-br ${color.gradient}`} />
                      <span className="block truncate px-1.5 py-1 text-[10px] text-slate-500 dark:text-slate-400">
                        {isRTL ? color.nameAr : color.name}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {isRTL ? selectedColorOption.nameAr : selectedColorOption.name}
                </p>
              </div>

              <div className="mt-5 space-y-2">
                {onPreview && (
                  <Button className="w-full" onClick={onPreview}>
                    <Eye className="h-4 w-4" />
                    {isRTL ? "معاينة الفاتورة كاملة" : "Preview full invoice"}
                    <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                  </Button>
                )}
                <p className="text-center text-[11px] text-slate-400">
                  {isRTL
                    ? "يمكنك تغيير القالب لاحقاً من الإعدادات."
                    : "You can change the template later from settings."}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
