import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

const CommandPalette: React.FC = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const { data: response, isFetching } = useGlobalSearch(debounced);
  const results = response?.success ? response.data || [] : [];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(term), 250);
    return () => window.clearTimeout(handle);
  }, [term]);

  useEffect(() => {
    if (!open) {
      setTerm("");
      setDebounced("");
    }
  }, [open]);

  const go = (route: string) => {
    navigate(route);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[18%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{isRTL ? "البحث الشامل" : "Global search"}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-800">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <Input
            autoFocus
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={isRTL ? "ابحث عن عميل، فاتورة، صنف..." : "Search customers, invoices, items..."}
            className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
            aria-label={isRTL ? "البحث الشامل" : "Global search"}
          />
          {isFetching && <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />}
          <button onClick={() => setOpen(false)} aria-label={isRTL ? "إغلاق" : "Close"} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {debounced.trim().length < 2 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {isRTL ? "اكتب حرفين على الأقل للبحث." : "Type at least two characters to search."}
            </p>
          ) : results.length === 0 && !isFetching ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {isRTL ? "لا توجد نتائج." : "No results found."}
            </p>
          ) : (
            results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => go(result.route)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-start transition-colors hover:bg-brand-50 dark:hover:bg-brand-950/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{result.title}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {result.type}
                    {result.subtitle ? ` · ${result.subtitle}` : ""}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-[11px] text-slate-400 dark:border-slate-800">
          <span>{isRTL ? "البحث الشامل" : "Global search"}</span>
          <span>Ctrl/Cmd + K</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
