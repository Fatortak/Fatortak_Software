import React, { useState } from "react";
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Menu,
  Moon,
  Sun,
  Globe,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUserProfile } from "../../hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  useNotifications,
  useMarkAsRead,
  useUnreadNotificationsCount,
} from "../../hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";

interface ModernHeaderProps {
  onMenuClick: () => void;
  className?: string;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({
  onMenuClick,
  className = "",
}) => {
  const { language, toggleLanguage, isRTL, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch user profile data
  const { data: userProfileResponse } = useCurrentUserProfile();
  const userProfile = userProfileResponse?.success
    ? userProfileResponse.data
    : null;
  const { logout } = useAuth();

  // Notification hooks
  // const { data: notificationsData } = useNotifications(
  //   { pageNumber: 1, pageSize: 5 },
  //   { isRead: false },
  // );
  // const { data: unreadCount } = useUnreadNotificationsCount();
  // const { mutate: markAsRead } = useMarkAsRead();

  // const notifications = notificationsData?.data?.data || [];
  // const totalUnread = unreadCount?.data || 0;

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast.error(`${t("logoutError")}: ${error}`);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-white" />;
      case "error":
        return <X className="w-4 h-4 text-white" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-white" />;
      default:
        return <Info className="w-4 h-4 text-white" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const handleNotificationClick = (_id: string) => {
    setShowNotifications(false);
  };

  return (
    <header
      className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 ${className}`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16`}>
          {/* Left Section - Menu & Search */}
          <div
            className={`flex items-center space-x-4 ${
              isRTL ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            <button
              onClick={onMenuClick}
              aria-label={isRTL ? "فتح القائمة" : "Open navigation"}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
              className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 sm:flex dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
              aria-label={isRTL ? "البحث الشامل" : "Global search"}
            >
              <Search className="h-4 w-4" />
              <span>{isRTL ? "بحث..." : "Search..."}</span>
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Center Section - Logo for mobile */}
          <div className="lg:hidden">
            <img
              src="/lovable-uploads/fatortak-logo.png"
              alt="FATORTAK"
              className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </div>

          {/* Right Section - Theme, Language, Notifications, Profile */}
          <div
            className={`flex items-center space-x-4 ${
              isRTL ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
              title={
                theme === "dark"
                  ? isRTL
                    ? "الوضع الفاتح"
                    : "Light mode"
                  : isRTL
                    ? "الوضع المظلم"
                    : "Dark mode"
              }
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              aria-label={isRTL ? "Switch to English" : "التبديل إلى العربية"}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
              title={isRTL ? "English" : "العربية"}
            >
              <Globe className="w-5 h-5" />
            </button>

            {/* Notifications */}
            {/* <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {totalUnread > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {totalUnread}
                  </Badge>
                )}
              </button>
              {showNotifications && (
                <div
                  className={`absolute top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 ${
                    isRTL ? "left-0" : "right-0"
                  }`}
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {isRTL ? "الإشعارات" : "Notifications"}
                      </h3>
                      <Badge variant="secondary">
                        {totalUnread} {isRTL ? "جديد" : "unread"}
                      </Badge>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                        {isRTL
                          ? "لا توجد إشعارات جديدة"
                          : "No new notifications"}
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer ${
                            !notification.isRead
                              ? "bg-blue-50/30 dark:bg-blue-900/10"
                              : ""
                          }`}
                          onClick={() =>
                            handleNotificationClick(notification.id)
                          }
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`w-8 h-8 ${getNotificationBg(
                                notification.notificationType || "info",
                              )} rounded-full flex items-center justify-center flex-shrink-0`}
                            >
                              {getNotificationIcon(
                                notification.notificationType || "info",
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center mt-2 text-xs text-slate-500 dark:text-slate-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDistanceToNow(
                                  new Date(notification.createdAt),
                                  {
                                    addSuffix: true,
                                  },
                                )}
                              </div>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => navigate("/notifications")}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {isRTL ? "عرض جميع الإشعارات" : "View all notifications"}
                    </button>
                  </div>
                </div>
              )}
            </div> */}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label={isRTL ? "قائمة المستخدم" : "User menu"}
                aria-expanded={showProfileMenu}
                className={`flex items-center space-x-3 p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors ${
                  isRTL ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                <Avatar className="h-8 w-8">
                  {userProfile?.profilePictureUrl ? (
                    <AvatarImage
                      src={userProfile.profilePictureUrl}
                      alt={userProfile.firstName}
                    />
                  ) : (
                    <AvatarFallback className="bg-brand-100 text-brand-700 text-sm dark:bg-brand-950 dark:text-brand-300">
                      {getInitials(
                        userProfile?.firstName,
                        userProfile?.lastName,
                      )}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div
                  className={`hidden sm:block ${
                    isRTL ? "text-end" : "text-start"
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {userProfile
                      ? `${userProfile.firstName} ${userProfile.lastName}`
                      : "User"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {userProfile?.role || "User"}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div
                  className={`absolute top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 ${
                    isRTL ? "left-0" : "right-0"
                  }`}
                >
                  <div className="py-2">
                    <button
                      onClick={handleProfileClick}
                      className={`w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-3 ${
                        isRTL
                          ? "flex-row-reverse space-x-reverse text-end"
                          : "text-start"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>{isRTL ? "الملف الشخصي" : "Profile"}</span>
                    </button>
                    <button
                      onClick={() => navigate("/settings")}
                      className={`w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-3 ${
                        isRTL
                          ? "flex-row-reverse space-x-reverse text-end"
                          : "text-start"
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>{isRTL ? "الإعدادات" : "Settings"}</span>
                    </button>
                    <hr className="my-2 border-slate-200 dark:border-slate-700" />
                    <button
                      onClick={handleLogout}
                      className={`w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-3 ${
                        isRTL
                          ? "flex-row-reverse space-x-reverse text-end"
                          : "text-start"
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isRTL ? "تسجيل الخروج" : "Sign out"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Click Outside Handler */}
      {(showProfileMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default ModernHeader;
