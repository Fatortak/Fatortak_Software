import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import ModernSidebar from "./ModernSidebar";
import ModernHeader from "./ModernHeader";
import { useLanguage } from "../../contexts/LanguageContext";

const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isRTL } = useLanguage();
  const location = useLocation();

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      // Auto-collapse sidebar on mobile and smaller screens
      if (mobile) {
        setSidebarCollapsed(true);
        setSidebarOpen(false); // Close mobile sidebar when switching to mobile
      } else if (window.innerWidth < 1280) {
        setSidebarCollapsed(true);
        setSidebarOpen(false); // Ensure mobile sidebar is closed on desktop
      } else {
        setSidebarCollapsed(false);
        setSidebarOpen(false); // Ensure mobile sidebar is closed on desktop
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, sidebarOpen]);

  const toggleSidebarCollapse = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex ${isRTL ? "rtl" : "ltr"} relative`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <a
        href="#main-content"
        className="absolute -top-24 start-4 z-[100] rounded-b-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white focus:top-0"
      >
        {isRTL ? "انتقل إلى المحتوى" : "Skip to content"}
      </a>
      {/* Sidebar Container */}
      {isMobile ? (
        // Mobile Sidebar - Rendered conditionally for better performance
        sidebarOpen && (
          <>
            {/* Mobile Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={closeMobileSidebar}
              aria-hidden="true"
            />

            {/* Mobile Sidebar */}
            <div
              className={`
                fixed inset-y-0 z-50 
                transform transition-transform duration-300 ease-in-out
                ${isRTL ? "right-0" : "left-0"}
                ${
                  sidebarOpen
                    ? "translate-x-0"
                    : isRTL
                    ? "translate-x-full"
                    : "-translate-x-full"
                }
              `}
            >
              <ModernSidebar
                collapsed={false} // Always expanded on mobile
                onToggleCollapse={toggleSidebarCollapse}
                onClose={closeMobileSidebar}
                isMobile={true}
              />
            </div>
          </>
        )
      ) : (
        // Desktop Sidebar
        <div className="relative z-30 flex-shrink-0">
          <ModernSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
            onClose={closeMobileSidebar}
            isMobile={false}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 z-20 relative">
          <ModernHeader onMenuClick={toggleSidebarCollapse} />
        </div>

        {/* Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`
            flex-1 bg-canvas dark:bg-slate-950
            min-h-[calc(100vh-4rem)] relative
            ${isMobile && sidebarOpen ? "pointer-events-none" : ""}
          `}
        >
          <div
            className={`
              h-full 
              transition-all duration-300 ease-in-out
              ${!isMobile && !sidebarCollapsed ? "ml-0" : ""}
            `}
          >
            <div className="max-w-full overflow-hidden">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
