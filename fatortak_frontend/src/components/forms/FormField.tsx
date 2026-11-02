import React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}) => (
  <div className={cn("space-y-1.5", className)}>
    {label && (
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
        {error}
      </p>
    ) : hint ? (
      <p className="text-xs text-slate-400">{hint}</p>
    ) : null}
  </div>
);

export default FormField;
