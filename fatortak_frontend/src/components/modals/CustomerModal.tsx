import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCreateCustomer } from "../../hooks/useCustomers";
import { CustomerCreateDto } from "../../types/api";
import { toast } from "react-toastify";
import PhoneInputField from "../ui/PhoneInputField";
import { isValidPhoneNumber } from "react-phone-number-input";
import FormErrorSummary, { FormErrorItem } from "@/components/forms/FormErrorSummary";
import { isValidEmail } from "@/lib/validation";

interface CustomerModalProps {
  isOpen: boolean;
  isSupplier: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  isSupplier,
  onClose,
  onSuccess,
}) => {
  const { isRTL, t } = useLanguage();
  const createCustomerMutation = useCreateCustomer();

  const [formData, setFormData] = useState<CustomerCreateDto>({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxNumber: "",
    vatNumber: "",
    paymentTerms: "",
    isSupplier: isSupplier || false,
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorSummary: FormErrorItem[] = Object.entries(errors)
    .filter(([, message]) => !!message)
    .map(([field, message]) => ({ field, message }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (!formData.name) {
      newErrors.name = t("customerName") + " " + t("required");
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = t("emailInvalid");
    }

    if (formData.taxNumber && formData.taxNumber.length > 50) {
      newErrors.taxNumber = isRTL ? "الرقم الضريبي طويل جداً" : "Tax number is too long";
    }

    if (formData.vatNumber && formData.vatNumber.length > 50) {
      newErrors.vatNumber = isRTL ? "رقم الضريبة طويل جداً" : "VAT number is too long";
    }

    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      newErrors.phone = t("invalidPhoneNumber");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      formData.isSupplier = isSupplier || false;

      const result = await createCustomerMutation.mutateAsync(formData);

      if (result.success) {
        toast.success(
          isSupplier
            ? t("supplierCreatedSuccessfully")
            : t("clientCreatedSuccessfully")
        );
        onSuccess?.();
        handleClose();
      }
    } catch (error) {
      toast.error(
        isSupplier
          ? t("failedToCreateSupplier")
          : t("failedToCreateClient")
      );
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      taxNumber: "",
      vatNumber: "",
      paymentTerms: "",
      notes: "",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isSupplier ? t("newSupplier") : t("newClient")}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <FormErrorSummary errors={errorSummary} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {isSupplier ? t("supplierName") : t("clientName")} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors({ ...errors, name: "" });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                  errors.name
                    ? "border-red-500"
                    : "border-slate-300 dark:border-slate-600"
                } ${isRTL ? "text-end" : "text-start"}`}
                placeholder={isSupplier ? t("supplierName") : t("clientName")}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t("email")}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setErrors({ ...errors, email: "" });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                  errors.email
                    ? "border-red-500"
                    : "border-slate-300 dark:border-slate-600"
                } ${isRTL ? "text-end" : "text-start"}`}
                placeholder={t("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <PhoneInputField
              value={formData.phone}
              onChange={(value) => {
                setFormData({ ...formData, phone: value || "" });
                setErrors({ ...errors, phone: "" });
              }}
              label={t("phone")}
              error={errors.phone}
            />

            {/* Tax Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t("taxNumber")}
              </label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) =>
                  setFormData({ ...formData, taxNumber: e.target.value })
                }
                className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                  isRTL ? "text-end" : "text-start"
                }`}
                placeholder={t("taxNumber")}
              />
            </div>

            {/* VAT Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t("vatNumber")}
              </label>
              <input
                type="text"
                value={formData.vatNumber}
                onChange={(e) =>
                  setFormData({ ...formData, vatNumber: e.target.value })
                }
                className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                  isRTL ? "text-end" : "text-start"
                }`}
                placeholder={t("vatNumber")}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("address")}
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                isRTL ? "text-end" : "text-start"
              }`}
              placeholder={t("address")}
            />
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("paymentTerms")}
            </label>
            <input
              type="text"
              value={formData.paymentTerms}
              onChange={(e) =>
                setFormData({ ...formData, paymentTerms: e.target.value })
              }
              className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                isRTL ? "text-end" : "text-start"
              }`}
              placeholder={t("paymentTerms")}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("notes")}
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                isRTL ? "text-end" : "text-start"
              }`}
              placeholder={t("notes")}
            />
          </div>

          {/* Buttons */}
          <div
            className={`flex justify-end space-x-4 ${
              isRTL ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={createCustomerMutation.isPending}
              className={`flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 ${
                isRTL ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {createCustomerMutation.isPending
                  ? t("creating")
                  : isSupplier
                  ? t("newSupplier")
                  : t("newClient")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
