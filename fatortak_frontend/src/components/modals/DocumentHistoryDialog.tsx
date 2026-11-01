import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDocumentRevisions } from "@/hooks/useDocumentRevisions";
import type { DocumentRevisionDto } from "@/types/api";

interface DocumentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: string;
  documentId?: string;
  documentNumber?: string;
}

const actionTone = (action: string) => {
  switch (action) {
    case "Added":
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Modified":
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "Deleted":
      return "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
};

const changedFields = (changes?: string) => {
  if (!changes) return [];
  try {
    return Object.keys(JSON.parse(changes));
  } catch {
    return [];
  }
};

const prettyJson = (value?: string) => {
  if (!value) return "";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

const DocumentHistoryDialog: React.FC<DocumentHistoryDialogProps> = ({
  open,
  onOpenChange,
  documentType,
  documentId,
  documentNumber,
}) => {
  const { isRTL } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: response, isLoading } = useDocumentRevisions(
    documentType,
    documentId,
    open
  );
  const revisions: DocumentRevisionDto[] = useMemo(
    () => (response?.success ? response.data || [] : []),
    [response]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-brand-600" />
            {isRTL ? "سجل الإصدارات" : "Revision history"}
            {documentNumber ? ` — ${documentNumber}` : ""}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            {isRTL ? "جارٍ التحميل..." : "Loading revisions..."}
          </div>
        ) : revisions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-700">
            <History className="mx-auto mb-3 h-7 w-7 text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRTL
                ? "لا توجد إصدارات مسجلة لهذا المستند بعد."
                : "No revisions recorded for this document yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {revisions.map((revision) => {
              const fields = changedFields(revision.changes);
              const isOpen = expanded === revision.id;
              return (
                <div
                  key={revision.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : revision.id)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {isRTL ? `الإصدار ${revision.revision}` : `Revision ${revision.revision}`}
                          <Badge className={`ms-2 ${actionTone(revision.action)}`}>
                            {revision.action}
                          </Badge>
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {new Date(revision.createdAt).toLocaleString()}
                          {revision.userName ? ` · ${revision.userName}` : ""}
                        </p>
                      </div>
                    </div>
                    {fields.length > 0 && (
                      <span className="hidden shrink-0 text-xs text-slate-400 sm:block">
                        {fields.length} {isRTL ? "حقل" : fields.length === 1 ? "field" : "fields"}
                      </span>
                    )}
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-slate-100 px-3 py-2 dark:border-slate-800">
                      {fields.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {fields.map((field) => (
                            <Badge
                              key={field}
                              className="border-slate-200 bg-slate-50 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {field}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <pre className="max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-200">
                        {prettyJson(revision.changes || revision.snapshot) ||
                          (isRTL ? "لا توجد تفاصيل" : "No details captured")}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRTL ? "إغلاق" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentHistoryDialog;
