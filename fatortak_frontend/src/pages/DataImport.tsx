import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  ListChecks,
  Package,
  ShieldCheck,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useExecuteImport, usePreviewImport } from "@/hooks/useImport";
import type {
  ImportPreviewDto,
  ImportResultDto,
} from "@/types/api";

type ImportMode = "customers" | "items";

interface FieldDefinition {
  key: string;
  label: string;
  hint: string;
  required?: boolean;
}

const customerFields: FieldDefinition[] = [
  { key: "name", label: "Name", hint: "Customer or supplier name", required: true },
  { key: "email", label: "Email", hint: "Billing or accounts email" },
  { key: "phone", label: "Phone", hint: "Mobile or landline" },
  { key: "address", label: "Address", hint: "Billing address" },
  { key: "taxNumber", label: "Tax number", hint: "Tax registration / TIN" },
  { key: "vatNumber", label: "VAT number", hint: "VAT registration number" },
  { key: "paymentTerms", label: "Payment terms", hint: "e.g. Net 30" },
  { key: "notes", label: "Notes", hint: "Internal notes" },
];

const itemFields: FieldDefinition[] = [
  { key: "name", label: "Name", hint: "Product or service name", required: true },
  { key: "code", label: "Code / SKU", hint: "Unique item code" },
  { key: "description", label: "Description", hint: "Item description" },
  { key: "type", label: "Type", hint: "product or service" },
  { key: "unitPrice", label: "Sale price", hint: "Selling price" },
  { key: "purchaseUnitPrice", label: "Cost price", hint: "Purchase cost" },
  { key: "unit", label: "Unit", hint: "pcs, hour, month..." },
  { key: "vatRate", label: "VAT rate", hint: "14 or 0.14" },
  { key: "quantity", label: "Opening quantity", hint: "Stock on hand" },
];

const customerTemplate =
  "name,email,phone,address,taxNumber,vatNumber,paymentTerms,isSupplier,notes\n" +
  "Acme Trading,accounts@acme.test,+201000000000,12 Market Street,TAX-100,VAT-100,Net 30,false,Imported customer\n";
const itemTemplate =
  "code,name,description,type,unitPrice,purchaseUnitPrice,unit,vatRate,quantity\n" +
  "SKU-001,Consulting hour,Advisory service,service,150,0,hour,0.14,0\n" +
  "SKU-002,Office chair,Ergonomic chair,product,900,600,pcs,0.14,25\n";

const ACCEPTED_EXTENSIONS = [".csv", ".tsv", ".txt", ".xlsx", ".xlsm"];

const DataImport: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<ImportMode>("customers");
  const [isSupplier, setIsSupplier] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewDto | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ImportResultDto | null>(null);

  const previewMutation = usePreviewImport();
  const executeMutation = useExecuteImport();

  const fields = mode === "customers" ? customerFields : itemFields;
  const template = mode === "customers" ? customerTemplate : itemTemplate;
  const pending = previewMutation.isPending || executeMutation.isPending;

  const mappedFields = useMemo(
    () => fields.filter((field) => !!mapping[field.key]).length,
    [fields, mapping]
  );
  const missingRequired = useMemo(
    () =>
      fields.filter((field) => field.required && !mapping[field.key]),
    [fields, mapping]
  );

  const downloadTemplate = () => {
    const blob = new Blob([template], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${mode}-import-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const validateFile = (candidate: File) => {
    const extension = `.${candidate.name.split(".").pop()?.toLowerCase() || ""}`;
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      toast.error(
        isRTL
          ? "اختر ملف CSV أو Excel بصيغة xlsx."
          : "Choose a CSV or .xlsx workbook."
      );
      return false;
    }
    if (candidate.size > 10 * 1024 * 1024) {
      toast.error(
        isRTL ? "حجم الملف يجب ألا يتجاوز 10 ميجابايت." : "The file must be 10 MB or smaller."
      );
      return false;
    }
    return true;
  };

  const loadFile = async (candidate?: File) => {
    if (!candidate || !validateFile(candidate)) return;
    setFile(candidate);
    setResult(null);
    try {
      const response = await previewMutation.mutateAsync({
        file: candidate,
        entityType: mode,
        isSupplier,
      });
      const data = response.data;
      if (!data) {
        toast.error(isRTL ? "تعذر قراءة الملف." : "Could not read the file.");
        return;
      }
      setPreview(data);
      setMapping(data.suggestedMapping || {});
      setStep(2);
      if (data.errorRows > 0 || data.duplicateRows > 0) {
        toast.warning(
          isRTL
            ? `تم العثور على ${data.errorRows} صفاً به أخطاء و${data.duplicateRows} صفاً مكرراً.`
            : `${data.errorRows} row(s) need review and ${data.duplicateRows} duplicate row(s) will be skipped.`
        );
      }
    } catch (error: any) {
      toast.error(error?.message || "Could not read the file");
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void loadFile(event.dataTransfer.files?.[0]);
  };

  const switchMode = (next: ImportMode) => {
    setMode(next);
    setFile(null);
    setPreview(null);
    setMapping({});
    setResult(null);
    setStep(1);
    if (fileRef.current) fileRef.current.value = "";
  };

  const resetWizard = () => {
    setFile(null);
    setPreview(null);
    setMapping({});
    setResult(null);
    setStep(1);
    if (fileRef.current) fileRef.current.value = "";
  };

  const executeImport = async () => {
    if (!preview) return;
    if (!roleAccess.canCreate()) {
      toast.error(
        isRTL ? "تحتاج صلاحية الإنشاء للاستيراد." : "Create permission is required to import."
      );
      return;
    }
    if (missingRequired.length > 0) {
      toast.error(
        isRTL
          ? `اربط الحقول المطلوبة: ${missingRequired.map((field) => field.label).join(", ")}`
          : `Map the required fields: ${missingRequired.map((field) => field.label).join(", ")}`
      );
      return;
    }

    try {
      const response = await executeMutation.mutateAsync({
        entityType: mode,
        isSupplier,
        mapping,
        rows: preview.rows.map((row) => ({
          row: row.row,
          values: row.values,
        })),
      });
      setResult(response.data || null);
      setStep(3);
      toast.success(
        isRTL
          ? `تم استيراد ${response.data?.imported || 0} سجل`
          : `${response.data?.imported || 0} record(s) imported`
      );
    } catch (error: any) {
      toast.error(error?.message || "Could not import the file");
    }
  };

  const statusBadge = (row: ImportPreviewDto["rows"][number]) => {
    if (row.errors.length > 0) {
      return (
        <Badge className="border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {isRTL ? "خطأ" : "Error"}
        </Badge>
      );
    }
    if (row.duplicate) {
      return (
        <Badge className="border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {isRTL ? "مكرر" : "Duplicate"}
        </Badge>
      );
    }
    return (
      <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
        {isRTL ? "جاهز" : "Ready"}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "البيانات" : "Data"}
        title={isRTL ? "استيراد البيانات" : "Data import"}
        description={
          isRTL
            ? "استورد العملاء أو الموردين أو الأصناف من CSV أو Excel مع ربط الأعمدة والتحقق قبل الحفظ."
            : "Bring customers, suppliers or items from CSV or Excel with column mapping and validation before saving."
        }
        actions={
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            {isRTL ? "تنزيل القالب" : "Download template"}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {[
          { number: 1, label: isRTL ? "الملف" : "Upload" },
          { number: 2, label: isRTL ? "المطابقة والمراجعة" : "Map & review" },
          { number: 3, label: isRTL ? "النتيجة" : "Result" },
        ].map((item, index) => (
          <React.Fragment key={item.number}>
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step === item.number
                    ? "bg-brand-600 text-white"
                    : step > item.number
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {step > item.number ? <CheckCircle2 className="h-4 w-4" /> : item.number}
              </span>
              <span
                className={`text-sm font-medium ${
                  step === item.number
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </div>
            {index < 2 && (
              <div className="hidden h-px flex-1 bg-slate-200 sm:block dark:bg-slate-800" />
            )}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => switchMode("customers")}
              className={`rounded-2xl border p-4 text-start transition-colors ${
                mode === "customers"
                  ? "border-brand-300 bg-brand-50/70 dark:border-brand-800 dark:bg-brand-950/30"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Users className="h-5 w-5 text-brand-600" />
                {isRTL ? "العملاء والموردون" : "Customers and suppliers"}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isRTL
                  ? "الاسم والبريد والهاتف والعنوان والرقم الضريبي وشروط الدفع."
                  : "Name, email, phone, address, tax number and payment terms."}
              </p>
            </button>
            <button
              type="button"
              onClick={() => switchMode("items")}
              className={`rounded-2xl border p-4 text-start transition-colors ${
                mode === "items"
                  ? "border-brand-300 bg-brand-50/70 dark:border-brand-800 dark:bg-brand-950/30"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Package className="h-5 w-5 text-emerald-600" />
                {isRTL ? "الأصناف" : "Items"}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isRTL
                  ? "الكود والاسم والنوع والسعر والتكلفة والوحدة ونسبة الضريبة."
                  : "Code, name, type, price, cost, unit and VAT rate."}
              </p>
            </button>
          </div>

          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardContent className="space-y-5 p-5 sm:p-6">
              {mode === "customers" && (
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600"
                    checked={isSupplier}
                    onChange={(event) => setIsSupplier(event.target.checked)}
                  />
                  {isRTL ? "استيراد كملف موردين" : "This file contains suppliers"}
                </label>
              )}

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                  isDragging
                    ? "border-brand-400 bg-brand-50/60 dark:border-brand-700 dark:bg-brand-950/20"
                    : "border-slate-300 hover:border-brand-300 dark:border-slate-700"
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                  <FileUp className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                  {isRTL ? "اسحب الملف هنا أو اختره" : "Drop your file here or browse"}
                </h2>
                <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  {isRTL
                    ? "CSV أو Excel (xlsx) حتى 10 ميجابايت و5,000 صف. سيتم اقتراح ربط الأعمدة تلقائياً."
                    : "CSV or Excel (.xlsx) up to 10 MB and 5,000 rows. Column mapping is suggested automatically."}
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.xlsx,.xlsm"
                  className="sr-only"
                  onChange={(event) => void loadFile(event.target.files?.[0])}
                  aria-label={isRTL ? "اختيار ملف الاستيراد" : "Choose import file"}
                />
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    onClick={() => fileRef.current?.click()}
                    loading={previewMutation.isPending}
                  >
                    <Upload className="h-4 w-4" />
                    {isRTL ? "اختيار ملف" : "Choose file"}
                  </Button>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4" />
                    {isRTL ? "قالب CSV" : "CSV template"}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {file?.name || (isRTL ? "لم يتم اختيار ملف" : "No file selected")}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: ListChecks,
                    title: isRTL ? "ربط تلقائي" : "Auto mapping",
                    text: isRTL
                      ? "يتعرف على أسماء الأعمدة الشائعة والمرادفات العربية."
                      : "Recognizes common headers and Arabic aliases.",
                  },
                  {
                    icon: ShieldCheck,
                    title: isRTL ? "تحقق قبل الحفظ" : "Validate first",
                    text: isRTL
                      ? "يراجع البريد والأرقام والتكرارات قبل أي كتابة."
                      : "Checks emails, amounts and duplicates before writing.",
                  },
                  {
                    icon: FileSpreadsheet,
                    title: isRTL ? "CSV و Excel" : "CSV and Excel",
                    text: isRTL
                      ? "يدعم ملفات المنافسين وأنظمة المحاسبة الشائعة."
                      : "Works with competitor exports and common accounting files.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <item.icon className="h-4 w-4 text-brand-600" />
                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === 2 && preview && (
        <>
          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <FileSpreadsheet className="h-5 w-5 text-brand-600" />
                    {preview.fileName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {preview.format}
                    {preview.selectedSheet ? ` · ${preview.selectedSheet}` : ""} ·{" "}
                    {preview.totalRows} {isRTL ? "صف" : "rows"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {isRTL ? `جاهز: ${preview.validRows}` : `Ready: ${preview.validRows}`}
                  </Badge>
                  <Badge className="border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                    {isRTL ? `مكرر: ${preview.duplicateRows}` : `Duplicate: ${preview.duplicateRows}`}
                  </Badge>
                  <Badge className="border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    {isRTL ? `أخطاء: ${preview.errorRows}` : `Errors: ${preview.errorRows}`}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={resetWizard}>
                    {isRTL ? "تغيير الملف" : "Replace file"}
                  </Button>
                </div>
              </div>

              {preview.warnings.map((warning) => (
                <div
                  key={warning}
                  className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {warning}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    {isRTL ? "ربط الأعمدة" : "Column mapping"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {isRTL
                      ? "اختر العمود المقابل لكل حقل. الحقول المطلوبة مميزة."
                      : "Choose the source column for each target field. Required fields are marked."}
                  </p>
                </div>
                <Badge className="border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {mappedFields}/{fields.length} {isRTL ? "حقل" : "mapped"}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs font-semibold">
                        {field.label}
                        {field.required && <span className="ms-1 text-rose-500">*</span>}
                      </Label>
                      {mapping[field.key] ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : field.required ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      ) : null}
                    </div>
                    <Select
                      value={mapping[field.key] || "__none__"}
                      onValueChange={(value) =>
                        setMapping((prev) => {
                          const next = { ...prev };
                          if (value === "__none__") delete next[field.key];
                          else next[field.key] = value;
                          return next;
                        })
                      }
                    >
                      <SelectTrigger className="mt-2 h-9" aria-label={field.label}>
                        <SelectValue placeholder={isRTL ? "اختر عموداً" : "Choose column"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          {isRTL ? "عدم الاستيراد" : "Do not import"}
                        </SelectItem>
                        {preview.columns.map((column) => (
                          <SelectItem key={column.key} value={column.key}>
                            {column.key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1.5 truncate text-[11px] text-slate-400">
                      {mapping[field.key]
                        ? preview.columns.find((column) => column.key === mapping[field.key])?.samples.join(" · ") || field.hint
                        : field.hint}
                    </p>
                  </div>
                ))}
              </div>

              {missingRequired.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {isRTL
                    ? `اربط الحقول المطلوبة: ${missingRequired.map((field) => field.label).join(", ")}`
                    : `Map the required fields: ${missingRequired.map((field) => field.label).join(", ")}`}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
            <CardContent className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4 dark:border-slate-800">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  {isRTL ? "معاينة الصفوف" : "Row preview"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isRTL
                    ? `عرض أول ${Math.min(preview.rows.length, 40)} من ${preview.totalRows} صفاً.`
                    : `Showing the first ${Math.min(preview.rows.length, 40)} of ${preview.totalRows} rows.`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                  {isRTL ? "السابق" : "Back"}
                </Button>
                <Button
                  onClick={executeImport}
                  loading={executeMutation.isPending}
                  disabled={!roleAccess.canCreate() || missingRequired.length > 0}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isRTL
                    ? `استيراد ${Math.max(0, preview.totalRows - preview.errorRows - preview.duplicateRows)} صفاً`
                    : `Import ${Math.max(0, preview.totalRows - preview.errorRows - preview.duplicateRows)} rows`}
                </Button>
              </div>
            </CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">#</TableHead>
                    {fields
                      .filter((field) => mapping[field.key])
                      .slice(0, 5)
                      .map((field) => (
                        <TableHead key={field.key}>{field.label}</TableHead>
                      ))}
                    <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isRTL ? "التفاصيل" : "Details"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.slice(0, 40).map((row) => (
                    <TableRow key={row.row}>
                      <TableCell className="tabular-nums text-slate-400">{row.row}</TableCell>
                      {fields
                        .filter((field) => mapping[field.key])
                        .slice(0, 5)
                        .map((field) => (
                          <TableCell key={field.key} className="max-w-[180px] truncate">
                            {row.values[mapping[field.key]] || "-"}
                          </TableCell>
                        ))}
                      <TableCell>{statusBadge(row)}</TableCell>
                      <TableCell className="max-w-[220px] text-xs text-rose-600 dark:text-rose-400">
                        {row.errors.length > 0
                          ? row.errors.join(" ")
                          : row.duplicate
                            ? isRTL ? "سيتم تخطيه" : "Will be skipped"
                            : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {step === 3 && result && (
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {isRTL ? "اكتمل الاستيراد" : "Import complete"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isRTL
                    ? "راجع الملخص أدناه قبل الانتقال إلى السجلات."
                    : "Review the summary below before opening the records."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: isRTL ? "تم الاستيراد" : "Imported",
                  value: result.imported,
                  tone: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
                  icon: CheckCircle2,
                },
                {
                  label: isRTL ? "تم التخطي" : "Skipped",
                  value: result.skipped,
                  tone: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
                  icon: AlertTriangle,
                },
                {
                  label: isRTL ? "فشل" : "Failed",
                  value: result.failed,
                  tone: "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
                  icon: XCircle,
                },
              ].map((item) => (
                <div key={item.label} className={`rounded-2xl border p-4 ${item.tone}`}>
                  <item.icon className="h-4 w-4" />
                  <p className="mt-2 text-2xl font-bold tabular-nums">{item.value}</p>
                  <p className="text-xs font-medium">{item.label}</p>
                </div>
              ))}
            </div>

            {result.errors.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? "الصف" : "Row"}</TableHead>
                      <TableHead>{isRTL ? "السبب" : "Reason"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((error, index) => (
                      <TableRow key={`${error.row}-${index}`}>
                        <TableCell className="tabular-nums text-slate-500">{error.row}</TableCell>
                        <TableCell className="text-rose-600 dark:text-rose-400">{error.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={resetWizard}>
                <Upload className="h-4 w-4" />
                {isRTL ? "استيراد ملف آخر" : "Import another file"}
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = mode === "items" ? "/items" : "/clients")}>
                <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                {mode === "items"
                  ? isRTL ? "فتح الأصناف" : "Open items"
                  : isRTL ? "فتح العملاء" : "Open clients"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataImport;
