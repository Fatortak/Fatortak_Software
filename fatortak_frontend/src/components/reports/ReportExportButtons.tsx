import React, { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { exportService } from "@/services/exportService";

interface ReportExportButtonsProps {
  filename: string;
  elementId?: string;
}

const readLargestTable = (): Record<string, string>[] => {
  const container = document.getElementById("main-content") || document.body;
  const tables = Array.from(container.querySelectorAll("table"));
  if (tables.length === 0) return [];

  const table = tables.sort(
    (a, b) => b.querySelectorAll("tbody tr").length - a.querySelectorAll("tbody tr").length
  )[0];
  const headers = Array.from(table.querySelectorAll("thead th")).map(
    (header) => header.textContent?.trim() || ""
  );
  if (headers.length === 0) return [];

  return Array.from(table.querySelectorAll("tbody tr"))
    .filter((row) => !row.querySelector("td[colspan]"))
    .map((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      return headers.reduce<Record<string, string>>((result, header, index) => {
        result[header] = cells[index]?.textContent?.trim() || "";
        return result;
      }, {});
    })
    .filter((row) => Object.values(row).some(Boolean));
};

const ReportExportButtons: React.FC<ReportExportButtonsProps> = ({
  filename,
  elementId = "main-content",
}) => {
  const { isRTL } = useLanguage();
  const [exportingPdf, setExportingPdf] = useState(false);

  const exportCsv = () => {
    const rows = readLargestTable();
    if (rows.length === 0) {
      toast.error(isRTL ? "لا توجد بيانات للتصدير" : "There is no data to export");
      return;
    }
    exportService.exportToCSV(rows, `${filename}.csv`);
  };

  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportService.exportToPDF(elementId, `${filename}.pdf`);
    } catch (error: any) {
      toast.error(error?.message || "Could not export PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={exportCsv} title="Export CSV">
        <Download className="h-4 w-4" />
        CSV
      </Button>
      <Button variant="outline" onClick={exportPdf} disabled={exportingPdf} title="Export PDF">
        {exportingPdf ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        PDF
      </Button>
    </div>
  );
};

export default ReportExportButtons;
