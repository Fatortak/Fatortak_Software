import React, { useMemo, useState } from "react";
import { Bookmark, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useCreateSavedView,
  useDeleteSavedView,
  useSavedViews,
} from "@/hooks/useSavedViews";
import type { SavedViewDto } from "@/types/api";

interface SavedViewBarProps {
  pageKey: string;
  currentQuery: Record<string, string | undefined>;
  onApply: (query: Record<string, string | undefined>) => void;
}

const SavedViewBar: React.FC<SavedViewBarProps> = ({
  pageKey,
  currentQuery,
  onApply,
}) => {
  const { isRTL } = useLanguage();
  const [selectedId, setSelectedId] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState("");
  const [shared, setShared] = useState(false);
  const { data: response, isLoading } = useSavedViews(pageKey);
  const createMutation = useCreateSavedView(pageKey);
  const deleteMutation = useDeleteSavedView(pageKey);

  const views: SavedViewDto[] = useMemo(
    () => (response?.success ? response.data || [] : []),
    [response]
  );
  const selected = views.find((view) => view.id === selectedId);

  const apply = (id: string) => {
    setSelectedId(id);
    const view = views.find((item) => item.id === id);
    if (!view) return;
    try {
      const query = JSON.parse(view.queryJson);
      if (query && typeof query === "object") onApply(query);
    } catch {
      toast.error(isRTL ? "تعذر تحميل العرض المحفوظ" : "Could not load the saved view");
    }
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error(isRTL ? "أدخل اسم العرض" : "Enter a view name");
      return;
    }
    const cleanQuery = Object.fromEntries(
      Object.entries(currentQuery).filter(([, value]) => value !== undefined && value !== "")
    );
    try {
      await createMutation.mutateAsync({
        pageKey,
        name: name.trim(),
        queryJson: JSON.stringify(cleanQuery),
        isShared: shared,
      });
      toast.success(isRTL ? "تم حفظ العرض" : "View saved");
      setShowSave(false);
      setName("");
      setShared(false);
    } catch (error: any) {
      toast.error(error?.message || "Could not save view");
    }
  };

  const remove = async () => {
    if (!selected) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      toast.success(isRTL ? "تم حذف العرض" : "View deleted");
      setSelectedId("");
    } catch (error: any) {
      toast.error(error?.message || "Could not delete view");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Bookmark className="h-4 w-4 text-slate-400" />
      <Select value={selectedId} onValueChange={apply}>
        <SelectTrigger className="h-9 w-full sm:w-48" aria-label={isRTL ? "العروض المحفوظة" : "Saved views"}>
          <SelectValue
            placeholder={
              isLoading
                ? isRTL ? "جارٍ التحميل..." : "Loading..."
                : isRTL ? "عرض محفوظ" : "Saved views"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {views.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500">
              {isRTL ? "لا توجد عروض محفوظة" : "No saved views"}
            </div>
          ) : (
            views.map((view) => (
              <SelectItem key={view.id} value={view.id}>
                {view.name}
                {view.isShared ? ` · ${isRTL ? "مشترك" : "shared"}` : ""}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {selected?.isShared && (
        <Badge className="border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
          {isRTL ? "مشترك" : "Shared"}
        </Badge>
      )}
      <Button variant="outline" size="sm" onClick={() => setShowSave(true)}>
        <Plus className="h-4 w-4" />
        {isRTL ? "حفظ العرض" : "Save view"}
      </Button>
      {selected?.isOwner && (
        <Button
          variant="ghost"
          size="sm"
          onClick={remove}
          loading={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4 text-rose-500" />
          {isRTL ? "حذف" : "Delete"}
        </Button>
      )}

      <Dialog open={showSave} onOpenChange={setShowSave}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isRTL ? "حفظ العرض الحالي" : "Save current view"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{isRTL ? "الاسم" : "Name"} *</Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={isRTL ? "مثال: فواتير المتأخرة" : "e.g. Overdue invoices"}
                aria-label={isRTL ? "اسم العرض" : "View name"}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={shared}
                onChange={(event) => setShared(event.target.checked)}
              />
              {isRTL ? "مشترك مع فريق مساحة العمل" : "Share with the workspace team"}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSave(false)}>
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={save} loading={createMutation.isPending}>
              {isRTL ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedViewBar;
