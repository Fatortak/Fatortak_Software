import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Layers,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FormField from "@/components/forms/FormField";
import FormErrorSummary from "@/components/forms/FormErrorSummary";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { registrationService } from "@/services/registrationService";
import { unwrapServiceResult } from "@/services/api";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  subdomain: string;
  country: string;
  currency: string;
  address: string;
}

interface SubdomainState {
  status: "idle" | "checking" | "available" | "unavailable";
  reason?: string;
  suggestion?: string;
}

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  companyName: "",
  subdomain: "",
  country: "Egypt",
  currency: "EGP",
  address: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s()-]{7,20}$/;

const countrySuggestions = [
  "Algeria", "Argentina", "Australia", "Austria", "Bahrain", "Bangladesh",
  "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia", "Croatia",
  "Cyprus", "Czechia", "Denmark", "Egypt", "Estonia", "Ethiopia", "Finland",
  "France", "Germany", "Ghana", "Greece", "Hungary", "India", "Indonesia",
  "Iraq", "Ireland", "Italy", "Japan", "Jordan", "Kenya", "Kuwait", "Latvia",
  "Lebanon", "Libya", "Lithuania", "Malaysia", "Malta", "Mexico", "Morocco",
  "Netherlands", "New Zealand", "Nigeria", "Norway", "Oman", "Pakistan",
  "Palestine", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Saudi Arabia", "Senegal", "Singapore", "Slovakia", "Slovenia", "South Africa",
  "South Korea", "Spain", "Sudan", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tanzania", "Thailand", "Tunisia", "Turkey", "Uganda", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

const currencySuggestions = [
  "AED", "ARS", "AUD", "BHD", "BRL", "CAD", "CHF", "CLP", "CNY", "COP",
  "CZK", "DKK", "EGP", "EUR", "GBP", "GHS", "HKD", "HUF", "IDR", "ILS",
  "INR", "IQD", "JOD", "JPY", "KES", "KRW", "KWD", "LBP", "LYD", "MAD",
  "MXN", "MYR", "NGN", "NOK", "NZD", "OMR", "PHP", "PKR", "PLN", "QAR",
  "RON", "SAR", "SDG", "SEK", "SGD", "SYP", "THB", "TND", "TRY", "TWD",
  "UAH", "USD", "VND", "YER", "ZAR",
];

const normalizeSubdomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 30)
    .replace(/^-+|-+$/g, "");

const getSubdomainFormatError = (value: string, isRTL: boolean) => {
  if (!value) {
    return isRTL ? "عنوان مساحة العمل مطلوب" : "Workspace URL is required";
  }
  if (value.length < 3) {
    return isRTL ? "استخدم 3 أحرف على الأقل" : "Use at least 3 characters";
  }
  if (value.length > 30) {
    return isRTL ? "استخدم 30 حرفاً أو أقل" : "Use 30 characters or fewer";
  }
  if (value.startsWith("-") || value.endsWith("-")) {
    return isRTL
      ? "لا يمكن أن يبدأ أو ينتهي بشرطة"
      : "Cannot start or end with a hyphen";
  }
  if (!/^[a-z0-9-]+$/.test(value)) {
    return isRTL
      ? "استخدم أحرفاً صغيرة وأرقاماً وشرطات فقط"
      : "Use lowercase letters, numbers and hyphens only";
  }
  return "";
};

const PasswordMeter: React.FC<{
  password: string;
  confirmPassword: string;
  isRTL: boolean;
  showPassword: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
  error?: boolean;
}> = ({ password, confirmPassword, isRTL, showPassword, onToggle, onChange, error }) => {
  const checks = [
    {
      key: "length",
      met: password.length >= 12,
      label: isRTL ? "12 حرفاً على الأقل" : "At least 12 characters",
    },
    {
      key: "lower",
      met: /[a-z]/.test(password),
      label: isRTL ? "حرف صغير" : "A lowercase letter",
    },
    {
      key: "upper",
      met: /[A-Z]/.test(password),
      label: isRTL ? "حرف كبير" : "An uppercase letter",
    },
    {
      key: "number",
      met: /\d/.test(password),
      label: isRTL ? "رقم" : "A number",
    },
    {
      key: "symbol",
      met: /[^A-Za-z0-9]/.test(password),
      label: isRTL ? "رمز خاص" : "A symbol",
    },
    {
      key: "match",
      met: password.length > 0 && password === confirmPassword,
      label: isRTL ? "كلمتا المرور متطابقتان" : "Passwords match",
    },
  ];

  const score = checks.slice(0, 5).filter((check) => check.met).length;
  const strength =
    score <= 1
      ? { label: isRTL ? "ضعيفة" : "Weak", color: "bg-rose-500", text: "text-rose-600" }
      : score <= 3
        ? { label: isRTL ? "متوسطة" : "Fair", color: "bg-amber-500", text: "text-amber-600" }
        : score === 4
          ? { label: isRTL ? "جيدة" : "Good", color: "bg-sky-500", text: "text-sky-600" }
          : { label: isRTL ? "قوية" : "Strong", color: "bg-emerald-500", text: "text-emerald-600" };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Lock
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
            isRTL ? "right-3" : "left-3"
          }`}
        />
        <Input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => onChange(event.target.value)}
          placeholder={isRTL ? "كلمة مرور قوية" : "Create a strong password"}
          autoComplete="new-password"
          aria-invalid={!!error}
          className={`${isRTL ? "pe-10 ps-3" : "ps-9 pe-10"} ${
            error ? "border-rose-300 dark:border-rose-700" : ""
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          className={`absolute top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200 ${
            isRTL ? "left-2" : "right-2"
          }`}
          aria-label={showPassword ? (isRTL ? "إخفاء كلمة المرور" : "Hide password") : isRTL ? "إظهار كلمة المرور" : "Show password"}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 dark:text-slate-400">
            {isRTL ? "قوة كلمة المرور" : "Password strength"}
          </span>
          <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full ${
                index < score ? strength.color : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {checks.map((check) => (
          <li
            key={check.key}
            className={`flex items-center gap-1.5 text-[11px] ${
              check.met ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
            }`}
          >
            {check.met ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300 dark:border-slate-600" />
            )}
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Register: React.FC = () => {
  const { register } = useAuth();
  const { isRTL, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const copy = (en: string, ar: string) => (isRTL ? ar : en);
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const optionsQuery = useQuery({
    queryKey: ["registration-options"],
    queryFn: () => unwrapServiceResult(registrationService.getOptions()),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const options = optionsQuery.data?.data;
  const requiresSubdomain = options?.requiresSubdomain ?? true;
  const selfHosted = options?.mode === "SelfHosted";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [subdomainState, setSubdomainState] = useState<SubdomainState>({
    status: "idle",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    if (!requiresSubdomain) {
      setSubdomainState({ status: "idle" });
      return;
    }

    const value = form.subdomain;
    if (!value) {
      setSubdomainState({ status: "idle" });
      return;
    }

    const formatError = getSubdomainFormatError(value, isRTL);
    if (formatError) {
      setSubdomainState({ status: "unavailable", reason: formatError });
      return;
    }

    let cancelled = false;
    setSubdomainState({ status: "checking" });
    const timer = setTimeout(async () => {
      try {
        const result = await registrationService.checkSubdomain(value);
        if (cancelled) return;
        if (result.success && result.data) {
          setSubdomainState({
            status: result.data.available ? "available" : "unavailable",
            reason: result.data.reason ?? undefined,
            suggestion: result.data.suggestion ?? undefined,
          });
        } else {
          setSubdomainState({
            status: "unavailable",
            reason:
              result.errorMessage ||
              copy(
                "Could not verify this workspace URL.",
                "تعذر التحقق من عنوان مساحة العمل."
              ),
          });
        }
      } catch {
        if (!cancelled) {
          setSubdomainState({
            status: "unavailable",
            reason: copy(
              "Could not verify this workspace URL.",
              "تعذر التحقق من عنوان مساحة العمل."
            ),
          });
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.subdomain, requiresSubdomain, isRTL]);

  const passwordChecks = useMemo(
    () => [
      form.password.length >= 12,
      /[a-z]/.test(form.password),
      /[A-Z]/.test(form.password),
      /\d/.test(form.password),
      /[^A-Za-z0-9]/.test(form.password),
      form.password.length > 0 && form.password === form.confirmPassword,
    ],
    [form.password, form.confirmPassword]
  );

  const validateStep = (targetStep: number): Record<string, string> => {
    const next: Record<string, string> = {};

    if (targetStep === 1) {
      if (form.firstName.trim().length < 2) {
        next.firstName = copy("Enter your first name", "أدخل الاسم الأول");
      }
      if (form.lastName.trim().length < 2) {
        next.lastName = copy("Enter your last name", "أدخل اسم العائلة");
      }
      if (!emailPattern.test(form.email.trim())) {
        next.email = copy("Enter a valid email address", "أدخل بريداً إلكترونياً صحيحاً");
      }
      if (form.phone.trim() && !phonePattern.test(form.phone.trim())) {
        next.phone = copy("Enter a valid phone number", "أدخل رقم هاتف صحيح");
      }
      if (!passwordChecks.slice(0, 5).every(Boolean)) {
        next.password = copy(
          "Use at least 12 characters with upper case, lower case, a number and a symbol",
          "استخدم 12 حرفاً على الأقل مع حرف كبير وصغير ورقم ورمز"
        );
      }
      if (!form.confirmPassword) {
        next.confirmPassword = copy("Confirm your password", "أكد كلمة المرور");
      } else if (form.password !== form.confirmPassword) {
        next.confirmPassword = copy("Passwords do not match", "كلمتا المرور غير متطابقتين");
      }
    }

    if (targetStep === 2) {
      if (form.companyName.trim().length < 2) {
        next.companyName = copy("Enter your company name", "أدخل اسم الشركة");
      } else if (form.companyName.trim().length > 200) {
        next.companyName = copy("Use 200 characters or fewer", "استخدم 200 حرف أو أقل");
      }

      if (requiresSubdomain) {
        const formatError = getSubdomainFormatError(form.subdomain, isRTL);
        if (formatError) {
          next.subdomain = formatError;
        } else if (subdomainState.status === "checking") {
          next.subdomain = copy(
            "Wait for the availability check to finish",
            "انتظر انتهاء التحقق من التوفر"
          );
        } else if (subdomainState.status === "unavailable") {
          next.subdomain =
            subdomainState.reason ||
            copy("This workspace URL is not available", "عنوان مساحة العمل غير متاح");
        } else if (subdomainState.status !== "available") {
          next.subdomain = copy(
            "Check the workspace URL before continuing",
            "تحقق من عنوان مساحة العمل قبل المتابعة"
          );
        }
      }

      if (!form.country.trim()) {
        next.country = copy("Choose your country", "اختر بلدك");
      }
      if (!/^[A-Za-z]{3}$/.test(form.currency.trim())) {
        next.currency = copy(
          "Use a 3-letter currency code such as EGP or USD",
          "استخدم رمز عملة من 3 أحرف مثل EGP أو USD"
        );
      }
    }

    return next;
  };

  const goNext = () => {
    const nextErrors = validateStep(step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(copy("Review the highlighted fields", "راجع الحقول المحددة"));
      return;
    }
    setServerErrors([]);
    setStep((current) => Math.min(3, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setServerErrors([]);
    setStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step < 3) {
      goNext();
      return;
    }

    const stepOneErrors = validateStep(1);
    const stepTwoErrors = validateStep(2);
    const allErrors = { ...stepOneErrors, ...stepTwoErrors };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setStep(Object.keys(stepOneErrors).length > 0 ? 1 : 2);
      toast.error(copy("Review the highlighted fields", "راجع الحقول المحددة"));
      return;
    }
    if (!acceptedTerms) {
      setTermsError(
        copy(
          "Accept the terms of service and privacy policy to continue",
          "اقبل شروط الخدمة وسياسة الخصوصية للمتابعة"
        )
      );
      return;
    }

    setSubmitting(true);
    setServerErrors([]);
    setErrors({});
    setTermsError("");

    try {
      const result = await register({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        companyName: form.companyName.trim(),
        subdomain: requiresSubdomain ? form.subdomain : undefined,
        phoneNumber: form.phone.trim() || undefined,
        country: form.country.trim() || undefined,
        address: form.address.trim() || undefined,
        currency: form.currency.trim().toUpperCase(),
        acceptedTerms: true,
      });

      if (result.success) {
        toast.success(
          copy("Your workspace is ready", "مساحة عملك جاهزة")
        );
        navigate("/welcome", { replace: true });
        return;
      }

      const messages =
        result.errors && result.errors.length > 0
          ? result.errors
          : [result.errorMessage || copy("Registration failed", "فشل التسجيل")];
      setServerErrors(messages);

      const mappedErrors: Record<string, string> = {};
      if (messages.some((message) => /email/i.test(message))) {
        mappedErrors.email = messages.find((message) => /email/i.test(message)) || "";
      }
      if (messages.some((message) => /workspace url|subdomain/i.test(message))) {
        mappedErrors.subdomain =
          messages.find((message) => /workspace url|subdomain/i.test(message)) || "";
      }
      setErrors(mappedErrors);
      toast.error(copy("Registration could not be completed", "تعذر إكمال التسجيل"));
    } catch {
      setServerErrors([
        copy(
          "Registration failed. Check your connection and try again.",
          "فشل التسجيل. تحقق من اتصالك وحاول مرة أخرى."
        ),
      ]);
      toast.error(copy("Registration failed", "فشل التسجيل"));
    } finally {
      setSubmitting(false);
    }
  };

  const serverErrorItems = serverErrors.map((message, index) => ({
    field: `server-${index}`,
    message,
  }));
  const clientErrorItems = Object.entries(errors)
    .filter(([, message]) => !!message)
    .map(([field, message]) => ({ field, message }));
  const errorItems = [...clientErrorItems, ...serverErrorItems];

  const steps = [
    {
      number: 1,
      label: copy("Your account", "حسابك"),
      hint: copy("Name, email and password", "الاسم والبريد وكلمة المرور"),
    },
    {
      number: 2,
      label: copy("Workspace", "مساحة العمل"),
      hint: copy("Company and address", "الشركة والعنوان"),
    },
    {
      number: 3,
      label: copy("Review", "المراجعة"),
      hint: copy("Confirm and create", "التأكيد والإنشاء"),
    },
  ];

  if (optionsQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
          <p className="text-sm">{copy("Preparing registration...", "جارٍ تجهيز التسجيل...")}</p>
        </div>
      </div>
    );
  }

  if (optionsQuery.isError || !options) {
    return (
      <RegistrationMessage
        isRTL={isRTL}
        language={language}
        toggleLanguage={toggleLanguage}
        title={copy("Registration is unavailable", "التسجيل غير متاح")}
        description={copy(
          "We could not load the registration settings. Check your connection or try again later.",
          "تعذر تحميل إعدادات التسجيل. تحقق من اتصالك أو حاول لاحقاً."
        )}
        icon={AlertTriangle}
        actionLabel={copy("Try again", "حاول مرة أخرى")}
        onAction={() => optionsQuery.refetch()}
      />
    );
  }

  if (!options.allowRegistration) {
    return (
      <RegistrationMessage
        isRTL={isRTL}
        language={language}
        toggleLanguage={toggleLanguage}
        title={copy("Registration is closed", "التسجيل مغلق")}
        description={copy(
          "New workspaces are not being created on this deployment. Ask an administrator or sign in to an existing account.",
          "لا يتم إنشاء مساحات عمل جديدة على هذا النظام. اطلب من المسؤول أو سجّل الدخول إلى حساب موجود."
        )}
        icon={Lock}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ minHeight: "100dvh" }}
    >
      <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/login" className="flex items-center gap-3">
            <img
              src="/lovable-uploads/fatortak-logo.png"
              alt="FATORTAK"
              className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              title={language === "en" ? "العربية" : "English"}
            >
              <Globe className="h-4 w-4" />
              {language === "en" ? "العربية" : "English"}
            </button>
            <Link
              to="/login"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {copy("Sign in", "تسجيل الدخول")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-8 lg:py-10">
        <aside className="relative hidden overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              {options.trialDays}-{copy("day trial", "يوم تجربة")}
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-tight">
              {copy(
                "One workspace for sales, finance and operations.",
                "مساحة عمل واحدة للمبيعات والمالية والعمليات."
              )}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {copy(
                "Create your company account, invite your team and start invoicing in minutes.",
                "أنشئ حساب شركتك، ادعُ فريقك وابدأ الفوترة في دقائق."
              )}
            </p>

            <ul className="mt-8 space-y-4">
              {[
                {
                  icon: ShieldCheck,
                  title: copy("Secure by design", "آمن بالتصميم"),
                  text: copy(
                    "Role-based access and isolated tenant data.",
                    "صلاحيات حسب الدور وبيانات معزولة لكل شركة."
                  ),
                },
                {
                  icon: Layers,
                  title: copy("Everything connected", "كل شيء متصل"),
                  text: copy(
                    "Invoices, inventory, accounting and reports share one ledger.",
                    "الفواتير والمخزون والمحاسبة والتقارير على دفتر واحد."
                  ),
                },
                {
                  icon: Rocket,
                  title: copy("Guided onboarding", "بداية موجّهة"),
                  text: copy(
                    "Charts of accounts, tax settings and demo data are ready.",
                    "دليل الحسابات والإعدادات الضريبية والبيانات التجريبية جاهزة."
                  ),
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                    <item.icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-400">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mt-8 flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-slate-400">
            <BadgeCheck className="h-4 w-4 text-emerald-400" />
            {copy(
              "No credit card required. Cancel or upgrade anytime.",
              "لا حاجة لبطاقة ائتمان. يمكنك الإلغاء أو الترقية في أي وقت."
            )}
          </div>
        </aside>

        <main className="min-w-0">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-5 sm:px-7 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
                    {copy("Create workspace", "إنشاء مساحة عمل")}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {copy("Get started with Fatortak", "ابدأ مع فاتورتك")}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {selfHosted
                      ? copy(
                          "Your account will join this installation's workspace.",
                          "سينضم حسابك إلى مساحة العمل الخاصة بهذا التثبيت."
                        )
                      : copy(
                          "Choose a workspace URL your team will remember.",
                          "اختر عنوان مساحة عمل يتذكره فريقك."
                        )}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {options.trialDays}-{copy("day free trial", "يوم تجربة مجانية")}
                </div>
              </div>

              <ol className="mt-5 grid gap-2 sm:grid-cols-3">
                {steps.map((item) => {
                  const active = step === item.number;
                  const done = step > item.number;
                  return (
                    <li key={item.number}>
                      <button
                        type="button"
                        onClick={() => {
                          if (done) {
                            setServerErrors([]);
                            setStep(item.number);
                          }
                        }}
                        disabled={!done}
                        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition ${
                          active
                            ? "border-brand-300 bg-brand-50/70 dark:border-brand-800 dark:bg-brand-950/30"
                            : done
                              ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"
                              : "border-slate-200 bg-white opacity-70 dark:border-slate-700 dark:bg-slate-800/40"
                        } ${done ? "cursor-pointer hover:border-emerald-300" : "cursor-default"}`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            done
                              ? "bg-emerald-600 text-white"
                              : active
                                ? "bg-brand-600 text-white"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {done ? <Check className="h-3.5 w-3.5" /> : item.number}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                            {item.label}
                          </span>
                          <span className="block truncate text-[10px] text-slate-400">{item.hint}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7" noValidate>
              <FormErrorSummary errors={errorItems} />

              {step === 1 && (
                <div className="space-y-5">
                  <SectionHeading
                    icon={UserPlus}
                    title={copy("Your account", "حسابك")}
                    description={copy(
                      "This person becomes the workspace administrator.",
                      "سيصبح هذا الشخص مسؤول مساحة العمل."
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label={copy("First name", "الاسم الأول")}
                      htmlFor="firstName"
                      required
                      error={errors.firstName}
                    >
                      <div className="relative">
                        <User className={`input-icon ${isRTL ? "right-3" : "left-3"}`} />
                        <Input
                          id="firstName"
                          value={form.firstName}
                          onChange={(event) => setField("firstName", event.target.value)}
                          placeholder={copy("Amina", "أمينة")}
                          autoComplete="given-name"
                          aria-invalid={!!errors.firstName}
                          className={`${isRTL ? "pe-9" : "ps-9"} ${
                            errors.firstName ? "border-rose-300 dark:border-rose-700" : ""
                          }`}
                        />
                      </div>
                    </FormField>
                    <FormField
                      label={copy("Last name", "اسم العائلة")}
                      htmlFor="lastName"
                      required
                      error={errors.lastName}
                    >
                      <div className="relative">
                        <User className={`input-icon ${isRTL ? "right-3" : "left-3"}`} />
                        <Input
                          id="lastName"
                          value={form.lastName}
                          onChange={(event) => setField("lastName", event.target.value)}
                          placeholder={copy("Hassan", "حسن")}
                          autoComplete="family-name"
                          aria-invalid={!!errors.lastName}
                          className={`${isRTL ? "pe-9" : "ps-9"} ${
                            errors.lastName ? "border-rose-300 dark:border-rose-700" : ""
                          }`}
                        />
                      </div>
                    </FormField>
                    <FormField
                      label={copy("Work email", "بريد العمل")}
                      htmlFor="email"
                      required
                      error={errors.email}
                    >
                      <div className="relative">
                        <Mail className={`input-icon ${isRTL ? "right-3" : "left-3"}`} />
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(event) => setField("email", event.target.value)}
                          placeholder="you@company.com"
                          autoComplete="email"
                          aria-invalid={!!errors.email}
                          className={`${isRTL ? "pe-9" : "ps-9"} ${
                            errors.email ? "border-rose-300 dark:border-rose-700" : ""
                          }`}
                        />
                      </div>
                    </FormField>
                    <FormField
                      label={copy("Phone number", "رقم الهاتف")}
                      htmlFor="phone"
                      hint={copy("Optional, for account security", "اختياري، لأمان الحساب")}
                      error={errors.phone}
                    >
                      <div className="relative">
                        <Phone className={`input-icon ${isRTL ? "right-3" : "left-3"}`} />
                        <Input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(event) => setField("phone", event.target.value)}
                          placeholder="+20 100 000 0000"
                          autoComplete="tel"
                          aria-invalid={!!errors.phone}
                          className={`${isRTL ? "pe-9" : "ps-9"} ${
                            errors.phone ? "border-rose-300 dark:border-rose-700" : ""
                          }`}
                        />
                      </div>
                    </FormField>
                  </div>

                  <FormField
                    label={copy("Password", "كلمة المرور")}
                    required
                    error={errors.password}
                    hint={copy(
                      "Use a unique password you do not use elsewhere.",
                      "استخدم كلمة مرور فريدة لا تستخدمها في مكان آخر."
                    )}
                  >
                    <PasswordMeter
                      password={form.password}
                      confirmPassword={form.confirmPassword}
                      isRTL={isRTL}
                      showPassword={showPassword}
                      onToggle={() => setShowPassword((current) => !current)}
                      onChange={(value) => setField("password", value)}
                      error={!!errors.password}
                    />
                  </FormField>

                  <FormField
                    label={copy("Confirm password", "تأكيد كلمة المرور")}
                    htmlFor="confirmPassword"
                    required
                    error={errors.confirmPassword}
                  >
                    <div className="relative">
                      <Lock className={`input-icon ${isRTL ? "right-3" : "left-3"}`} />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(event) => setField("confirmPassword", event.target.value)}
                        placeholder={copy("Repeat your password", "أعد كتابة كلمة المرور")}
                        autoComplete="new-password"
                        aria-invalid={!!errors.confirmPassword}
                        className={`${isRTL ? "pe-10" : "ps-9 pe-10"} ${
                          errors.confirmPassword ? "border-rose-300 dark:border-rose-700" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className={`absolute top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ${
                          isRTL ? "left-2" : "right-2"
                        }`}
                        aria-label={copy("Toggle password visibility", "إظهار أو إخفاء كلمة المرور")}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormField>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <SectionHeading
                    icon={Building2}
                    title={copy("Your workspace", "مساحة عملك")}
                    description={copy(
                      "Tell us about the company that will use Fatortak.",
                      "أخبرنا عن الشركة التي ستستخدم فاتورتك."
                    )}
                  />

                  <FormField
                    label={copy("Company name", "اسم الشركة")}
                    htmlFor="companyName"
                    required
                    error={errors.companyName}
                  >
                    <div className="relative">
                      <Building2 className={`input-icon ${isRTL ? "right-3" : "left-3"}`} />
                      <Input
                        id="companyName"
                        value={form.companyName}
                        onChange={(event) => {
                          setField("companyName", event.target.value);
                          if (requiresSubdomain && !form.subdomain) {
                            const suggestion = normalizeSubdomain(event.target.value);
                            if (suggestion.length >= 3) {
                              setField("subdomain", suggestion);
                            }
                          }
                        }}
                        placeholder={copy("Acme Trading", "شركة أكمي للتجارة")}
                        autoComplete="organization"
                        aria-invalid={!!errors.companyName}
                        className={`${isRTL ? "pe-9" : "ps-9"} ${
                          errors.companyName ? "border-rose-300 dark:border-rose-700" : ""
                        }`}
                      />
                    </div>
                  </FormField>

                  {requiresSubdomain ? (
                    <FormField
                      label={copy("Workspace URL", "عنوان مساحة العمل")}
                      required
                      error={errors.subdomain}
                      hint={copy(
                        "Lowercase letters, numbers and hyphens. 3–30 characters.",
                        "أحرف صغيرة وأرقام وشرطات. من 3 إلى 30 حرفاً."
                      )}
                    >
                      <div
                        className={`flex overflow-hidden rounded-lg border bg-white dark:bg-slate-900 ${
                          errors.subdomain || subdomainState.status === "unavailable"
                            ? "border-rose-300 dark:border-rose-700"
                            : subdomainState.status === "available"
                              ? "border-emerald-300 dark:border-emerald-800"
                              : "border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <span className="flex items-center border-e border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          https://
                        </span>
                        <input
                          value={form.subdomain}
                          onChange={(event) =>
                            setField("subdomain", normalizeSubdomain(event.target.value))
                          }
                          placeholder="acme"
                          aria-label={copy("Workspace URL", "عنوان مساحة العمل")}
                          aria-invalid={!!errors.subdomain}
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                        />
                        <span className="flex items-center border-s border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          .fatortak.com
                        </span>
                      </div>

                      <div className="mt-2 min-h-[20px]">
                        {subdomainState.status === "checking" && (
                          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {copy("Checking availability...", "جارٍ التحقق من التوفر...")}
                          </p>
                        )}
                        {subdomainState.status === "available" && (
                          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {copy("Workspace URL is available", "عنوان مساحة العمل متاح")}
                          </p>
                        )}
                        {subdomainState.status === "unavailable" && (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                            <span className="flex items-center gap-1.5">
                              <XCircle className="h-3.5 w-3.5" />
                              {subdomainState.reason ||
                                copy("This workspace URL is not available", "هذا العنوان غير متاح")}
                            </span>
                            {subdomainState.suggestion && (
                              <button
                                type="button"
                                onClick={() => setField("subdomain", subdomainState.suggestion || "")}
                                className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                              >
                                {copy("Use", "استخدم")} {subdomainState.suggestion}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </FormField>
                  ) : (
                    <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-3 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                      {copy(
                        "This self-hosted installation manages its own address. Your account will join the existing workspace.",
                        "هذا التثبيت المحلي يدير عنوانه الخاص. سينضم حسابك إلى مساحة العمل الحالية."
                      )}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label={copy("Country", "البلد")}
                      htmlFor="country"
                      required
                      error={errors.country}
                    >
                      <div className="relative">
                        <MapPin className={`input-icon ${isRTL ? "right-3" : "left-3"}`} />
                        <Input
                          id="country"
                          list="register-countries"
                          value={form.country}
                          onChange={(event) => setField("country", event.target.value)}
                          placeholder={copy("Country", "البلد")}
                          autoComplete="country-name"
                          aria-invalid={!!errors.country}
                          className={`${isRTL ? "pe-9" : "ps-9"} ${
                            errors.country ? "border-rose-300 dark:border-rose-700" : ""
                          }`}
                        />
                        <datalist id="register-countries">
                          {countrySuggestions.map((country) => (
                            <option key={country} value={country} />
                          ))}
                        </datalist>
                      </div>
                    </FormField>
                    <FormField
                      label={copy("Currency", "العملة")}
                      htmlFor="currency"
                      required
                      error={errors.currency}
                    >
                      <Input
                        id="currency"
                        list="register-currencies"
                        value={form.currency}
                        onChange={(event) => setField("currency", event.target.value.toUpperCase())}
                        placeholder="EGP"
                        maxLength={3}
                        aria-invalid={!!errors.currency}
                        className={errors.currency ? "border-rose-300 dark:border-rose-700" : ""}
                      />
                      <datalist id="register-currencies">
                        {currencySuggestions.map((currency) => (
                          <option key={currency} value={currency} />
                        ))}
                      </datalist>
                    </FormField>
                  </div>

                  <FormField
                    label={copy("Business address", "عنوان النشاط")}
                    htmlFor="address"
                    hint={copy("Optional, used on invoices", "اختياري، يظهر على الفواتير")}
                  >
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(event) => setField("address", event.target.value)}
                      placeholder={copy("Street, city, postal code", "الشارع، المدينة، الرمز البريدي")}
                      autoComplete="street-address"
                    />
                  </FormField>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <SectionHeading
                    icon={ShieldCheck}
                    title={copy("Review and create", "المراجعة والإنشاء")}
                    description={copy(
                      "Confirm the details below. You can change them later in settings.",
                      "أكد التفاصيل أدناه. يمكنك تغييرها لاحقاً من الإعدادات."
                    )}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReviewCard
                      title={copy("Administrator", "المسؤول")}
                      icon={User}
                      rows={[
                        [copy("Name", "الاسم"), `${form.firstName} ${form.lastName}`.trim()],
                        [copy("Email", "البريد"), form.email],
                        [copy("Phone", "الهاتف"), form.phone || copy("Not provided", "غير مقدم")],
                      ]}
                    />
                    <ReviewCard
                      title={copy("Workspace", "مساحة العمل")}
                      icon={Building2}
                      rows={[
                        [copy("Company", "الشركة"), form.companyName],
                        [
                          requiresSubdomain ? copy("Workspace URL", "عنوان مساحة العمل") : copy("Workspace", "مساحة العمل"),
                          requiresSubdomain ? `${form.subdomain}.fatortak.com` : form.subdomain || copy("Installation workspace", "مساحة التثبيت"),
                        ],
                        [copy("Country", "البلد"), form.country],
                        [copy("Currency", "العملة"), form.currency.toUpperCase()],
                      ]}
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          {copy("What happens next?", "ماذا يحدث بعد ذلك؟")}
                        </p>
                        <p className="mt-1">
                          {copy(
                            `We create your workspace, seed the chart of accounts and start a ${options.trialDays}-day trial. You can invite your team right away.`,
                            `سننشئ مساحة عملك ونضيف دليل الحسابات ونبدأ تجربة لمدة ${options.trialDays} يوماً. يمكنك دعوة فريقك مباشرة.`
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`flex items-start gap-3 rounded-xl border p-3.5 transition ${
                        termsError
                          ? "border-rose-300 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(event) => {
                          setAcceptedTerms(event.target.checked);
                          if (event.target.checked) setTermsError("");
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                      />
                      <span className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                        {copy("I agree to the ", "أوافق على ")}
                        <a
                          href="https://fatortak.net/terms"
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-brand-700 underline-offset-2 hover:underline dark:text-brand-300"
                        >
                          {copy("terms of service", "شروط الخدمة")}
                        </a>
                        {copy(" and ", " و")}
                        <a
                          href="https://fatortak.net/privacy"
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-brand-700 underline-offset-2 hover:underline dark:text-brand-300"
                        >
                          {copy("privacy policy", "سياسة الخصوصية")}
                        </a>
                        {copy(
                          ". I understand my workspace data is isolated from other companies.",
                          ". وأفهم أن بيانات مساحة عملي معزولة عن الشركات الأخرى."
                        )}
                      </span>
                    </label>
                    {termsError && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
                        <AlertTriangle className="h-3 w-3" />
                        {termsError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div>
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={goBack} disabled={submitting}>
                      <BackIcon className="h-4 w-4" />
                      {copy("Back", "السابق")}
                    </Button>
                  ) : (
                    <p className="hidden text-xs text-slate-400 sm:block">
                      {copy("Already have an account?", "لديك حساب بالفعل؟")}{" "}
                      <Link to="/login" className="font-semibold text-brand-700 dark:text-brand-300">
                        {copy("Sign in", "سجل الدخول")}
                      </Link>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {step < 3 ? (
                    <Button type="submit" className="w-full sm:w-auto">
                      {copy("Continue", "متابعة")}
                      <ArrowIcon className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" loading={submitting} className="w-full sm:w-auto">
                      <Sparkles className="h-4 w-4" />
                      {copy("Create workspace", "إنشاء مساحة العمل")}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            {copy(
              "Protected by rate limiting, encrypted transport and isolated tenant data.",
              "محمي بحدود معدل الطلبات والنقل المشفر وبيانات معزولة لكل شركة."
            )}
          </p>
        </main>
      </div>
    </div>
  );
};

const SectionHeading: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  </div>
);

const ReviewCard: React.FC<{
  title: string;
  icon: React.ElementType;
  rows: Array<[string, string]>;
}> = ({ title, icon: Icon, rows }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
      <Icon className="h-3.5 w-3.5" />
      {title}
    </p>
    <dl className="mt-3 space-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 text-xs">
          <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
          <dd className="max-w-[65%] truncate text-end font-medium text-slate-800 dark:text-slate-100">
            {value || "—"}
          </dd>
        </div>
      ))}
    </dl>
  </div>
);

const RegistrationMessage: React.FC<{
  isRTL: boolean;
  language: string;
  toggleLanguage: () => void;
  title: string;
  description: string;
  icon: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ isRTL, language, toggleLanguage, title, description, icon: Icon, actionLabel, onAction }) => (
  <div
    className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    dir={isRTL ? "rtl" : "ltr"}
    style={{ minHeight: "100dvh" }}
  >
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <img
        src="/lovable-uploads/fatortak-logo.png"
        alt="FATORTAK"
        className="mx-auto h-8 w-auto object-contain dark:brightness-0 dark:invert"
      />
      <div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <Icon className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-6 flex flex-col gap-2">
        {actionLabel && onAction && (
          <Button onClick={onAction}>
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        <Link
          to="/login"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {isRTL ? "العودة لتسجيل الدخول" : "Back to sign in"}
        </Link>
        <button
          onClick={toggleLanguage}
          className="mt-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          {language === "en" ? "العربية" : "English"}
        </button>
      </div>
    </div>
  </div>
);

export default Register;
