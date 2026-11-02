import React from "react";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface FormErrorItem {
  field: string;
  message: string;
}

interface FormErrorSummaryProps {
  errors: FormErrorItem[];
  className?: string;
}

const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({ errors, className }) => {
  const { isRTL } = useLanguage();
  if (errors.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm dark:border-rose-900 dark:bg-rose-950/30 ${className || ""}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
        <div>
          <p className="font-medium text-rose-700 dark:text-rose-300">
            {isRTL
              ? `يرجى تصحيح ${errors.length} ${errors.length === 1 ? "خطأ" : "أخطاء"} قبل الحفظ`
              : `Fix ${errors.length} ${errors.length === 1 ? "issue" : "issues"} before saving`}
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-rose-600 dark:text-rose-400">
            {errors.map((error) => (
              <li key={`${error.field}-${error.message}`}>{error.message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FormErrorSummary;
