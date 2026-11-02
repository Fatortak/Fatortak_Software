import React, { useState } from "react";
import TemplateSelector from "./TemplateSelector";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Printer, Save } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { invoiceTemplates } from "@/components/invoice-templates";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useCurrentCompany,
  useUpdateCompanyInvoiceTemplate,
} from "@/hooks/useCompanies";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify"; // or your preferred toast library

// Mock data for demo
const mockInvoice = {
  id: "cf96fe34-b822-4a6b-bb03-fdc6aceb2601",
  invoiceNumber: "INV-0027",
  customerId: "a32d8323-5e54-44b6-a5b4-3e8173d3489d",
  customerName: "اولاد غریب",
  customerPhoneNumber: "01112777721",
  issueDate: "2025-09-25T00:00:00",
  dueDate: "2025-09-25T00:00:00",
  status: "Paid",
  subtotal: 2503.0,
  vatAmount: 500.6,
  totalDiscount: 0.0,
  total: 3003.6,
  currency: "EGP",
  notes: null,
  terms: null,
  invoiceType: "Buy",
  company: null,
  items: [
    {
      id: "ff4ebbaa-52a2-4f76-a6b1-12c4d2cbcd7d",
      itemId: "6a449abc-7982-40ab-b9eb-4ab86a83d568",
      itemName: "ك سلك 1/2۱۰۰ سم ك / 55ق",
      description: "ك سلك 1/2۱۰۰ سم ك / 55ق",
      quantity: 10,
      unitPrice: 32.5,
      vatRate: 0.2,
      discount: 0.0,
      lineTotal: 390.0,
    },
    {
      id: "6552a2aa-6aa7-4695-bde0-2d4f5f943f36",
      itemId: "f846f163-0066-4d1d-ab27-d8ae4e6b42e5",
      itemName: "٦٠ هامش مسطر باندا كوت",
      description: "٦٠ هامش مسطر باندا كوت",
      quantity: 50,
      unitPrice: 11.0,
      vatRate: 0.2,
      discount: 0.0,
      lineTotal: 660.0,
    },
    {
      id: "391c3dc4-9d45-49fc-b9ef-7cb9f26ef7ca",
      itemId: "f58ab466-bd2f-45a0-a469-e3657eca2c58",
      itemName: "ك سلك ۱۰۰ ك / 60 ق",
      description: "ك سلك ۱۰۰ ك / 60 ق",
      quantity: 20,
      unitPrice: 30.0,
      vatRate: 0.2,
      discount: 0.0,
      lineTotal: 720.0,
    },
    {
      id: "e25c63a7-d86b-4ea1-8ed8-ba4c057d24a8",
      itemId: "273421e4-0538-485f-b80f-9bd9205785fd",
      itemName: "ك ۸۰ مسطر هامش /8ق",
      description: "ك ۸۰ مسطر هامش /8ق",
      quantity: 56,
      unitPrice: 13.0,
      vatRate: 0.2,
      discount: 0.0,
      lineTotal: 873.6,
    },
    {
      id: "be0170a4-d516-4c80-9860-dfe30c29edaf",
      itemId: "d56fc090-9399-4507-b6e2-de41aa5ebe10",
      itemName: "ك ٦٠ انجليزي هامش",
      description: "ك ٦٠ انجليزي هامش",
      quantity: 30,
      unitPrice: 10.0,
      vatRate: 0.2,
      discount: 0.0,
      lineTotal: 360.0,
    },
  ],
  createdAt: "0001-01-01T00:00:00",
  sentAt: null,
  paidAt: null,
  downPayment: 2503.0,
  amountPaid: 3003.6,
  benefits: 0.0,
  hasInstallments: false,
  installments: [],
};

const mockCompany = {
  name: "شركة فاتورتك / Fatortak Co.",
  address: "المهندسين - الجيزة - مصر / Mohandessin - Giza - Egypt",
  email: "info@fatortak.net",
  phone: "+20 155 357 9746",
  taxNumber: "123456789",
  currency: "EGP",
  logoUrl: "https://fatortak.net/logo.png",
};

const InvoiceTemplateDemo: React.FC = () => {
  const { invoiceType } = useParams();
  const [selectedTemplate, setSelectedTemplate] = useState("modern-gradient");
  const [selectedColor, setSelectedColor] = useState("professional-dark");
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);
  const { t, isRTL } = useLanguage();

  // Use the actual company data and mutation hook
  const { data: currentCompanyResult } = useCurrentCompany();
  const currentCompany = currentCompanyResult?.data;
  const updateInvoiceTemplateMutation = useUpdateCompanyInvoiceTemplate();

  const formatCurrency = (amount: number) => amount.toFixed(2);

  const getStatusColor = (status: string) => {
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
  };

  const getInvoiceTypeColor = (type: string) => {
    return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
  };

  // Function to handle template update
  const handleUpdateTemplate = async () => {
    try {
      await updateInvoiceTemplateMutation.mutateAsync({
        data: {
          invoiceType: invoiceType || "default", // Use the invoiceType from URL params or default
          template: selectedTemplate,
          color: selectedColor,
        },
      });
      toast.success(
        isRTL ? "تم تحديث القالب بنجاح" : "Template updated successfully"
      );
    } catch (error) {
      toast.error(isRTL ? "فشل في تحديث القالب" : "Failed to update template");
      console.error("Failed to update template:", error);
    }
  };

  // Function to handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handlePreview = () => setShowTemplateSelector(false);

  if (showTemplateSelector) {
    return (
      <TemplateSelector
        onSelectTemplate={handleSelectTemplate}
        onPreview={handlePreview}
        selectedTemplate={selectedTemplate}
        isRTL={isRTL}
        t={t}
        companyLogo={currentCompany?.logoUrl || mockCompany.logoUrl}
        onSelectColor={setSelectedColor}
        selectedColor={selectedColor}
      />
    );
  }

  // Get the selected template component
  const SelectedTemplateComponent =
    invoiceTemplates[selectedTemplate as keyof typeof invoiceTemplates];
  const previewInvoice = {
    ...mockInvoice,
    invoiceType: invoiceType === "sell" ? "Sell" : "Buy",
    currency: currentCompany?.currency || mockInvoice.currency,
  };

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <PageHeader
        eyebrow={isRTL ? "معاينة القالب" : "Template preview"}
        title={isRTL ? "معاينة الفاتورة" : "Invoice preview"}
        description={
          isRTL
            ? "راجع الشكل النهائي للفاتورة قبل حفظ القالب."
            : "Review the final invoice look before saving this template."
        }
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              variant="outline"
              onClick={() => setShowTemplateSelector(true)}
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
              {isRTL ? "تغيير القالب" : "Change template"}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              {isRTL ? "طباعة" : "Print"}
            </Button>
            <Button
              onClick={handleUpdateTemplate}
              disabled={updateInvoiceTemplateMutation.isPending}
            >
              <Save className="h-4 w-4" />
              {updateInvoiceTemplateMutation.isPending
                ? isRTL
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isRTL
                  ? "حفظ القالب"
                  : "Save template"}
            </Button>
          </div>
        }
      />

      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <FileText className="h-4 w-4 text-brand-600" />
            <span className="font-medium">
              {selectedTemplate.replace(/-/g, " ")}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-500">{selectedColor.replace(/-/g, " ")}</span>
          </div>
          <span className="text-xs text-slate-400">
            {invoiceType === "sell"
              ? isRTL ? "فاتورة بيع" : "Sales invoice"
              : isRTL ? "فاتورة شراء" : "Purchase invoice"}
          </span>
        </div>

        <div
          id="invoice-preview"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-8 dark:border-slate-800"
        >
          <SelectedTemplateComponent
            invoice={previewInvoice}
            company={currentCompany || mockCompany}
            isRTL={isRTL}
            t={t}
            formatCurrency={formatCurrency}
            getStatusColor={getStatusColor}
            getInvoiceTypeColor={getInvoiceTypeColor}
            customColor={selectedColor}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplateDemo;
