import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useQuery } from "@tanstack/react-query";
import * as Yup from "yup";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { registrationService } from "../services/registrationService";
import { unwrapServiceResult } from "../services/api";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Globe,
  AlertTriangle,
  Loader2,
  FileText,
  BarChart3,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isRTL, t, toggleLanguage, language } = useLanguage();
  const registrationOptions = useQuery({
    queryKey: ["registration-options"],
    queryFn: () => unwrapServiceResult(registrationService.getOptions()),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const canRegister =
    registrationOptions.data?.data?.allowRegistration === true;

  // Login validation schema
  const loginSchema = Yup.object().shape({
    email: Yup.string().email(t("emailInvalid")).required(t("emailRequired")),
    password: Yup.string()
      .min(6, t("passwordMinError"))
      .required(t("passwordRequired")),
  });

  const initialValues = {
    email: "",
    password: "",
  };

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting, setErrors }: any,
  ) => {
    setIsLoading(true);
    setSubmitting(true);

    try {
      const success = await login(values.email, values.password);

      if (success) {
        toast.success(t("loginSuccess"));
        navigate("/dashboard");
      } else {
        // This will trigger if login returns false (invalid credentials)
        setErrors({
          email: t("invalidCredentials"),
          password: t("invalidCredentials"),
        });
        toast.error(t("invalidCredentials"));
      }
    } catch (error: any) {
      // Handle different types of errors
      let errorMessage = t("unexpectedError");

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;

        if (status === 401) {
          errorMessage = t("invalidCredentials");
          setErrors({
            email: t("invalidCredentials"),
            password: t("invalidCredentials"),
          });
        } else if (status === 403) {
          errorMessage = t("accountSuspended");
        } else if (status === 429) {
          errorMessage = t("tooManyAttempts");
        } else if (status >= 500) {
          errorMessage = t("serverError");
        }
      } else if (error.request) {
        // Network error
        errorMessage = t("networkError");
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4"
      style={{ minHeight: "100dvh" }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Language Switcher - Top Right */}
      <div className={`absolute top-6 z-20 ${isRTL ? "left-6" : "right-6"}`}>
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-200 shadow-lg hover:shadow-xl"
          title={language === "en" ? "العربية" : "English"}
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">
            {language === "en" ? "العربية" : "English"}
          </span>
        </button>
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 relative z-10">
        {/* Left Side - Brand & Features (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-col justify-center px-12 space-y-8">
          <div className={`space-y-6 ${isRTL ? "text-end" : "text-start"}`}>
            {/* Logo */}
            <div>
              <img
                src="/lovable-uploads/fatortak-logo.png"
                alt="FATORTAK"
                className="h-9 w-auto object-contain dark:brightness-0 dark:invert"
              />
              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                {t("businessManagement")}
              </p>
            </div>

            {/* Welcome Text */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white leading-tight">
                {t("welcomeBack")}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                {t("enterCredentials")}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-6 mt-8">
              {[
                { icon: FileText, title: t("invoices"), desc: t("manageAllInvoicesEasily") },
                { icon: BarChart3, title: t("reports"), desc: t("revenueAnalytics") },
                { icon: Users, title: t("customers"), desc: t("customerAnalytics") },
              ].map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-start space-x-4 rounded-xl border border-slate-200/70 bg-white p-4 transition-colors hover:border-brand-200 ${
                      isRTL ? "flex-row-reverse space-x-reverse text-end" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <FeatureIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-8 flex flex-col items-center lg:hidden">
              <img
                src="/lovable-uploads/fatortak-logo.png"
                alt="FATORTAK"
                className="h-9 w-auto object-contain dark:brightness-0 dark:invert"
              />
              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                {t("businessManagement")}
              </p>
            </div>

            {/* Login Card */}
            <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-slate-800 dark:bg-slate-900">
              <div
                className={`text-center space-y-2 ${isRTL ? "text-end" : ""}`}
              >
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {t("signInToAccount")}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {t("enterCredentials")}
                </p>
              </div>

              <Formik
                initialValues={initialValues}
                validationSchema={loginSchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched, isSubmitting }) => (
                  <Form className="space-y-5">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className={`block text-[13px] font-medium text-slate-700 dark:text-slate-300 ${
                          isRTL ? "text-end" : ""
                        }`}
                      >
                        {t("email")} *
                      </label>
                      <div className="relative">
                        <Mail
                          className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 ${
                            isRTL ? "right-4" : "left-4"
                          }`}
                        />
                        <Field
                          name="email"
                          type="email"
                          className={`w-full h-11 bg-white dark:bg-slate-900 border rounded-lg focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-colors text-slate-800 dark:text-white ${
                            isRTL ? "pr-12 pl-4 text-end" : "pl-12 pr-4"
                          } ${
                            errors.email && touched.email
                              ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                          placeholder={t("email")}
                          disabled={isLoading}
                        />
                      </div>
                      <ErrorMessage name="email">
                        {(msg) => (
                          <p
                            className={`text-sm text-red-500 flex items-center gap-1 ${
                              isRTL ? "text-end flex-row-reverse" : ""
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {msg}
                          </p>
                        )}
                      </ErrorMessage>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className={`block text-[13px] font-medium text-slate-700 dark:text-slate-300 ${
                          isRTL ? "text-end" : ""
                        }`}
                      >
                        {t("password")} *
                      </label>
                      <div className="relative">
                        <Lock
                          className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 ${
                            isRTL ? "right-4" : "left-4"
                          }`}
                        />
                        <Field
                          name="password"
                          type={showPassword ? "text" : "password"}
                          className={`w-full h-11 bg-white dark:bg-slate-900 border rounded-lg focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-colors text-slate-800 dark:text-white ${
                            isRTL ? "pr-12 pl-12 text-end" : "pl-12 pr-12"
                          } ${
                            errors.password && touched.password
                              ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                          placeholder={t("password")}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ${
                            isRTL ? "left-4" : "right-4"
                          }`}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage name="password">
                        {(msg) => (
                          <p
                            className={`text-sm text-red-500 flex items-center gap-1 ${
                              isRTL ? "text-end flex-row-reverse" : ""
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {msg}
                          </p>
                        )}
                      </ErrorMessage>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading || isSubmitting}
                      className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-50 ${
                        isRTL ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      {isLoading || isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t("signingIn")}</span>
                        </>
                      ) : (
                        <>
                          <span>{t("signIn")}</span>
                          <ArrowIcon className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </Form>
                )}
              </Formik>

              {/* Register Link */}
              {canRegister && (
                <div
                  className={`border-t border-slate-200 pt-4 text-center dark:border-slate-700 ${
                    isRTL ? "text-end" : ""
                  }`}
                >
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isRTL ? "ليس لديك حساب؟" : "New to Fatortak?"}{" "}
                    <Link
                      to="/register"
                      className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
                    >
                      {isRTL ? "أنشئ مساحة عمل" : "Create a workspace"}
                    </Link>
                  </p>
                </div>
              )}
              <div className={`text-center ${isRTL ? "text-end" : ""}`}>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
                {t("signingIn")}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t("pleaseWait")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
