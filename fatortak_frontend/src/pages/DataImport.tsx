import React, { useRef, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Package,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useImportCustomers, useImportItems } from "@/hooks/useImport";
import type { ImportResultDto } from "@/types/api";

type ImportMode = "customers" | "items";

const customerTemplate =
  "name,email,phone,address,taxNumber,vatNumber,paymentTerms,isSupplier,notes\n" +
  "Acme Trading,accounts@acme.test,+201000000000,12 Market Street,TAX-100,VAT-100,Net 30,false,Imported customer\n";
const itemTemplate =
  "code,name,description,type,unitPrice,purchaseUnitPrice,unit,vatRate,quantity\n" +
  "SKU-001,Consulting hour,Advisory service,service,150,0,hour,0.14,0\n" +
  "SKU-002,Office chair,Ergonomic chair,product,900,600,pcs,0.14,25\n";

const DataImport: React.FC = () => {
  const { isRTL } = useLanguage();
  const roleAccess = useRoleAccess();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImportMode>("customers");
  const [isSupplier, setIsSupplier] = useState(false);
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResultDto | null>(null);
  const customerImport = useImportCustomers();
  const itemImport = useImportItems();
  const pending = customerImport.isPending || itemImport.isPending;

  const template = mode === "customers" ? customerTemplate : itemTemplate;

  const downloadTemplate = () => {
    const blob = new Blob([template], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${mode}-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setCsv(await file.text());
    setResult(null);
  };

  const submit = async () => {
    if (!csv.trim()) {
      toast.error(isRTL ? "اختر ملف CSV أولاً" : "Choose a CSV file first");
      return;
    }
    if (!roleAccess.canCreate()) {
      toast.error(isRTL ? "لا تملك صلاحية الاستيراد" : "You do not have import permission");
      return;
    }
    try {
      const response =
        mode === "customers"
          ? await customerImport.mutateAsync({ csv, isSupplier })
          : await itemImport.mutateAsync(csv);
      const importResult = response.data;
      setResult(importResult || null);
      toast.success(
        isRTL
          ? `تم استيراد ${importResult?.imported || 0} سجل`
          : `${importResult?.imported || 0} record(s) imported`
      );
      setCsv("");
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (error: any) {
      toast.error(error?.message || "Could not import the file");
    }
  };

  const switchMode = (next: ImportMode) => {
    setMode(next);
    setCsv("");
    setFileName("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "البيانات" : "Data"}
        title={isRTL ? "استيراد البيانات" : "Data import"}
        description={
          isRTL
            ? "استورد العملاء أو الموردين أو الأصناف من ملف CSV مع تقرير بالأخطاء والتكرارات."
            : "Import customers, suppliers or items from CSV with duplicates skipped and row-level errors."
        }
        actions={
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            {isRTL ? "تنزيل القالب" : "Download template"}
          </Button>
        }
      />

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
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                <FileSpreadsheet className="h-5 w-5 text-brand-600" />
                {mode === "customers"
                  ? isRTL ? "استيراد العملاء والموردين" : "Import customers and suppliers"
                  : isRTL ? "استيراد الأصناف" : "Import items"}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isRTL
                  ? "الصف الأول عناوين الأعمدة، والصفوف التالية سجلات البيانات."
                  : "The first row is the header; each following row is a record."}
              </p>
            </div>
            {mode === "customers" && (
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={isSupplier}
                  onChange={(event) => setIsSupplier(event.target.checked)}
                />
                {isRTL ? "استيراد كموردين" : "Import as suppliers"}
              </label>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{isRTL ? "ملف CSV" : "CSV file"}</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => onFile(event.target.files?.[0])}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm file:me-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-2 file:py-1 file:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:file:bg-brand-950"
              aria-label={isRTL ? "ملف CSV" : "CSV file"}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {fileName || (isRTL ? "لم يتم اختيار ملف" : "No file selected")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>{isRTL ? "أو الصق محتوى CSV" : "Or paste CSV content"}</Label>
            <textarea
              value={csv}
              onChange={(event) => {
                setCsv(event.target.value);
                setResult(null);
              }}
              rows={7}
              spellCheck={false}
              placeholder={template}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900"
              aria-label={isRTL ? "محتوى CSV" : "CSV content"}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={submit} loading={pending} disabled={!roleAccess.canCreate()}>
              <Upload className="h-4 w-4" />
              {isRTL ? "بدء الاستيراد" : "Start import"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCsv("");
                setFileName("");
                setResult(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              {isRTL ? "مسح" : "Clear"}
            </Button>
            {!roleAccess.canCreate() && (
              <span className="text-xs text-slate-500">
                {isRTL ? "تحتاج صلاحية الإنشاء للاستيراد." : "Create permission is required to import."}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
          <CardContent className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              {isRTL ? `تم الاستيراد: ${result.imported}` : `Imported: ${result.imported}`}
            </Badge>
            <Badge className="border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              {isRTL ? `تم التخطي: ${result.skipped}` : `Skipped: ${result.skipped}`}
            </Badge>
            <Badge className="border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {isRTL ? `فشل: ${result.failed}` : `Failed: ${result.failed}`}
            </Badge>
          </CardContent>
          {result.errors.length > 0 ? (
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
          ) : (
            <CardContent className="flex items-center gap-2 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              <UserPlus className="h-4 w-4" />
              {isRTL ? "تمت معالجة كل الصفوف بنجاح." : "All rows were processed successfully."}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default DataImport;
