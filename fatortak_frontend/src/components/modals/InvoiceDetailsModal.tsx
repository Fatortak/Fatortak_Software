import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Download,
  Send,
  Edit,
  Calendar,
  User,
  FileText,
  DollarSign,
  Printer,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Paperclip,
  Eye,
  History,
  LayoutTemplate,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCurrentCompany } from "../../hooks/useCompanies";
import { formatCurrency } from "@/Helpers/formatCurrency";
import { toast } from "react-toastify";
import { invoiceTemplates } from "../invoice-templates";
import { exportService } from "@/services/exportService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DocumentHistoryDialog from "./DocumentHistoryDialog";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { t, isRTL } = useLanguage();
  const { data: companyResult, isLoading: companyLoading } =
    useCurrentCompany();
  const [historyOpen, setHistoryOpen] = useState(false);

  if (!isOpen || !invoice) return null;

  const company = companyResult?.data;
  const selectedTemplate =
    invoice?.invoiceType?.toLowerCase() == "sell"
      ? company?.saleInvoiceTemplate
      : company?.purchaseInvoiceTemplate || "modern-gradient";
  const selectedColor =
    invoice?.invoiceType?.toLowerCase() == "sell"
      ? company?.saleInvoiceTemplateColor
      : company?.purchaseInvoiceTemplateColor || "professional-dark";

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      case "sent":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      case "draft":
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800";
      case "overdue":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      case "cancelled":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800";
    }
  };

  const getInvoiceTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "buy":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "sell":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400";
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-print-content");
    if (!printContent) return;

    const printWindow = window.open("", "", "height=800,width=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${t("print")} - ${invoice.invoiceNumber}</title>
          <style>
            @media print { 
              body { margin: 0; font-size: 12px; }
              .no-print { display: none; }
            }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #8B5CF6; }
            .company-section { display: flex; align-items: center; gap: 20px; }
            .company-logo { max-height: 80px; max-width: 200px; object-fit: contain; }
            .company-info h1 { margin: 0; font-size: 28px; font-weight: bold; color: #1F2937; }
            .company-info p { margin: 4px 0; color: #6B7280; font-size: 14px; }
            .invoice-header { text-align: right; }
            .invoice-number { font-size: 32px; font-weight: bold; color: #8B5CF6; margin: 0; }
            .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
            .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin: 40px 0; }
            .detail-section { background: #F9FAFB; padding: 24px; border-radius: 12px; border-left: 4px solid #8B5CF6; }
            .detail-section h3 { margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1F2937; display: flex; align-items: center; gap: 8px; }
            .detail-item { margin-bottom: 12px; }
            .detail-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
            .detail-value { font-size: 15px; font-weight: 600; color: #1F2937; }
            .items-section { margin: 40px 0; }
            .items-section h3 { font-size: 18px; font-weight: 600; color: #1F2937; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
            .items-table th { background: #8B5CF6; color: white; padding: 16px; text-align: left; font-weight: 600; font-size: 14px; }
            .items-table td { padding: 16px; border-bottom: 1px solid #E5E7EB; }
            .items-table tbody tr:hover { background: #F9FAFB; }
            .items-table tbody tr:last-child td { border-bottom: none; }
            .item-name { font-weight: 600; color: #1F2937; }
            .item-description { color: #6B7280; font-size: 13px; margin-top: 4px; }
            .totals-section { background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); color: white; padding: 24px; border-radius: 12px; margin-top: 40px; }
            .totals-section h3 { margin: 0 0 16px 0; font-size: 18px; display: flex; align-items: center; gap: 8px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .totals-row.total { font-size: 24px; font-weight: bold; border-top: 2px solid rgba(255,255,255,0.3); padding-top: 12px; margin-top: 12px; }
            .notes-section { margin-top: 40px; padding: 20px; background: #F3F4F6; border-radius: 8px; }
            .notes-section h3 { margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1F2937; }
            .text-center { text-align: center; }
            .text-end { text-align: right; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #6B7280; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer">
            <p>${t("thankYouMessage")}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
    setTimeout(() => printWindow.close(), 100);
  };

  const handleDownloadPDF = async () => {
    try {
      const element = document.getElementById("invoice-print-content");
      if (!element) return;
      // Use shared export logic (includes Arabic/RTL fixes)
      await exportService.exportToPDF(
        "invoice-print-content",
        `invoice-${invoice.invoiceNumber}.pdf`
      );
    } catch (error) {
      toast.error(t("pdfGenerationFailed") || "Failed to generate PDF");
    }
  };
  // Add a fallback template
  const SelectedTemplateComponent =
    invoiceTemplates[selectedTemplate as keyof typeof invoiceTemplates] ||
    invoiceTemplates["modern-gradient"]; // Fallback to a default template

  // Or check if it exists before rendering
  if (!SelectedTemplateComponent) {
    console.error(
      `Template "${selectedTemplate}" not found in invoiceTemplates`
    );
    return null; // or render a fallback
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg w-full max-w-5xl max-h-[95vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-8 border-b border-slate-200 dark:border-slate-700 bg-brand-50/60 dark:bg-brand-950/20`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t("invoiceDetails")}
              </h2>
            </div>
          </div>
          <button
            onClick={() => setHistoryOpen(true)}
            className="me-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 transition-all duration-200 hover:bg-white/50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
            aria-label={isRTL ? "سجل الإصدارات" : "Revision history"}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{isRTL ? "الإصدارات" : "History"}</span>
          </button>
          <Link
            to={
              invoice.invoiceType?.toLowerCase() === "sell"
                ? "/invoice-templates/sell"
                : "/invoice-templates/buy"
            }
            className="me-2 hidden items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 transition-all duration-200 hover:bg-white/50 hover:text-slate-700 sm:flex dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
          >
            <LayoutTemplate className="h-4 w-4" />
            <span>{isRTL ? "القالب" : "Template"}</span>
          </Link>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content for both display and print */}
        <div
          id="invoice-print-content"
          className="p-8"
          dir={isRTL ? "rtl" : "ltr"}
          style={
            isRTL
              ? { direction: "rtl", unicodeBidi: "plaintext", textAlign: "right" }
              : undefined
          }
        >
          <SelectedTemplateComponent
            invoice={invoice}
            company={company}
            isRTL={isRTL}
            t={t}
            formatCurrency={formatCurrency}
            getStatusColor={getStatusColor}
            getInvoiceTypeColor={getInvoiceTypeColor}
            customColor={selectedColor}
          />
        </div>

        {/* Payment History & Installments Section */}
        {invoice.installments && invoice.installments.length > 0 && (
          <div className="px-8 pb-8">
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {isRTL ? "سجل المدفوعات والأقساط" : "Payment & Installment History"}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isRTL ? `إجمالي ${invoice.installments.length} أقساط` : `Total of ${invoice.installments.length} installments`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {invoice.installments.map((installment: any, index: number) => (
                  <div 
                    key={installment.id || index}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4 rtl:space-x-reverse mb-3 md:mb-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        installment.status === 'Paid' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                      }`}>
                        {installment.status === 'Paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(installment.amount)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {isRTL ? "تاريخ الاستحقاق:" : "Due Date:"} {formatDate(installment.dueDate)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className={`${getStatusColor(installment.status)}`}>
                        {t(`status.${installment.status.toLowerCase()}`)}
                      </Badge>

                      {installment.attachmentUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2 text-blue-600 border-blue-100 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-900/20"
                          onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'https://localhost:44338'}/${installment.attachmentUrl}`, '_blank')}
                        >
                          <Paperclip className="w-4 h-4" />
                          <span>{isRTL ? "عرض الإيصال" : "View Receipt"}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
          <div
            className={`flex flex-wrap gap-4 justify-center ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm "
            >
              <Printer className="w-5 h-5" />
              <span>{t("print")}</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm "
            >
              <Download className="w-5 h-5" />
              <span>{t("download")}</span>
            </button>
            {invoice.attachmentUrl && (
              <button
                onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'https://localhost:44338'}/${invoice.attachmentUrl}`, '_blank')}
                className="flex items-center space-x-2 px-4 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all duration-200 shadow-sm hover:shadow-md transform "
              >
                <Paperclip className="w-5 h-5" />
                <span>{isRTL ? "عرض المرفق" : "View Attachment"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <DocumentHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        documentType="Invoice"
        documentId={invoice.id}
        documentNumber={invoice.invoiceNumber}
      />
    </div>
  );
};

export default InvoiceDetailsModal;
