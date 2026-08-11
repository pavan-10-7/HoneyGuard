import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, Outlet } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
  Target,
  Terminal,
  X,
} from "lucide-react";

const navigation = [
  {
    label: "Overview",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Sessions",
    path: "/sessions",
    icon: Target,
  },
  {
    label: "Live Events",
    path: "/events",
    icon: Activity,
  },
  {
    label: "Timeline",
    path: "/timeline",
    icon: Terminal,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Alerts",
    path: "/alerts",
    icon: AlertTriangle,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: FileText,
  },
];

const secondaryNavigation = [
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export function BaseLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--hg-bg)] text-[var(--hg-text)]">
      {/* =====================================================
          Desktop sidebar
          ===================================================== */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--hg-sidebar-width)] border-r border-[#292929] bg-[#0b0b0b] lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* =====================================================
          Mobile navigation
          ===================================================== */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="hg-mobile-overlay lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileNavOpen(false)}
            />

            <motion.aside
              className="hg-mobile-sidebar lg:hidden"
              aria-label="Mobile navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                duration: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="flex h-full flex-col">
                <div className="flex h-[var(--hg-header-height)] items-center justify-between border-b border-[#242424] px-4">
                  <Brand />

                  <button
                    type="button"
                    aria-label="Close navigation"
                    className="hg-bevel flex h-9 w-9 items-center justify-center rounded-lg text-[#8d8d8d] hover:text-white"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <X size={17} strokeWidth={1.8} />
                  </button>
                </div>

                <div className="px-4 pt-4">
                  <div className="hg-inset flex items-center justify-between px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="hg-status-dot hg-status-dot--success" />

                      <span className="truncate text-[11px] font-medium text-[#bdbdbd]">
                        System Operational
                      </span>
                    </div>

                    <span className="hg-mono ml-2 text-[9px] text-[#666]">
                      LIVE
                    </span>
                  </div>
                </div>

                <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
                  <div className="mb-2 px-2">
                    <span className="hg-label">Monitor</span>
                  </div>

                  <div className="space-y-1">
                    {navigation.map((item) => (
                      <SidebarItem
                        key={item.path}
                        {...item}
                        onNavigate={() => setMobileNavOpen(false)}
                      />
                    ))}
                  </div>

                  <div className="mb-2 mt-7 px-2">
                    <span className="hg-label">System</span>
                  </div>

                  <div className="space-y-1">
                    {secondaryNavigation.map((item) => (
                      <SidebarItem
                        key={item.path}
                        {...item}
                        onNavigate={() => setMobileNavOpen(false)}
                      />
                    ))}
                  </div>
                </nav>

                <OperatorCard />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* =====================================================
          Main application
          ===================================================== */}

      <div className="lg:pl-[var(--hg-sidebar-width)]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[var(--hg-header-height)] items-center justify-between border-b border-[#292929] bg-[#0b0b0b]/95 px-3 backdrop-blur-sm sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
            {/* Mobile menu */}
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
              className="hg-bevel flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#969696] hover:text-white lg:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={18} strokeWidth={1.8} />
            </button>

            <div className="min-w-0">
              <div className="hg-label truncate">
                Security Operations Center
              </div>

              <h1 className="mt-0.5 truncate text-[14px] font-semibold tracking-tight text-white sm:text-[15px]">
                Threat Overview
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* WebSocket status */}
            <div className="hg-inset hidden items-center gap-2 px-3 py-2 md:flex">
              <span className="hg-status-dot hg-status-dot--success" />

              <span className="text-[10px] font-medium text-[#a9a9a9]">
                Live Connection
              </span>
            </div>

            {/* Compact live indicator for small screens */}
            <div
              className="hg-inset flex h-9 w-9 items-center justify-center md:hidden"
              title="Live Connection"
              aria-label="Live Connection"
            >
              <span className="hg-status-dot hg-status-dot--success" />
            </div>

            <button
              type="button"
              aria-label="Notifications"
              className="hg-bevel relative flex h-9 w-9 items-center justify-center rounded-lg text-[#9b9b9b] hover:text-white"
            >
              <Bell size={16} strokeWidth={1.8} />

              <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--hg-critical)] shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
            </button>

            <button
              type="button"
              aria-label="Activity"
              className="hg-bevel hidden h-9 w-9 items-center justify-center rounded-lg text-[#9b9b9b] hover:text-white sm:flex"
            >
              <Activity size={16} strokeWidth={1.8} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-var(--hg-header-height))] overflow-x-hidden p-3 sm:p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   Sidebar content
   ========================================================= */

function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[var(--hg-header-height)] items-center border-b border-[#242424] px-5">
        <Brand />
      </div>

      <div className="px-4 pt-5">
        <div className="hg-inset flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="hg-status-dot hg-status-dot--success" />

            <span className="text-[11px] font-medium text-[#bdbdbd]">
              System Operational
            </span>
          </div>

          <span className="hg-mono text-[9px] text-[#666]">LIVE</span>
        </div>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto px-3">
        <div className="mb-2 px-2">
          <span className="hg-label">Monitor</span>
        </div>

        <div className="space-y-1">
          {navigation.map((item) => (
            <SidebarItem key={item.path} {...item} />
          ))}
        </div>

        <div className="mb-2 mt-7 px-2">
          <span className="hg-label">System</span>
        </div>

        <div className="space-y-1">
          {secondaryNavigation.map((item) => (
            <SidebarItem key={item.path} {...item} />
          ))}
        </div>
      </nav>

      <OperatorCard />
    </div>
  );
}

/* =========================================================
   Brand
   ========================================================= */

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="hg-bevel flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[rgba(214,169,40,0.4)] bg-[#171717]">
        <Shield
          size={19}
          strokeWidth={1.8}
          className="text-[var(--hg-gold-bright)]"
        />
      </div>

      <div className="min-w-0">
        <div className="text-[14px] font-semibold tracking-wide text-white">
          HoneyGuard
        </div>

        <div className="hg-label mt-0.5 truncate text-[9px]">
          Security Operations
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Operator
   ========================================================= */

function OperatorCard() {
  return (
    <div className="border-t border-[#242424] p-3">
      <div className="hg-raised flex items-center gap-3 px-3 py-3">
        <div className="hg-bevel flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          <span className="text-[11px] font-semibold text-[var(--hg-gold-bright)]">
            OP
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-medium text-[#dedede]">
            Security Operator
          </div>

          <div className="hg-mono mt-0.5 truncate text-[9px] text-[#656565]">
            LOCAL CONSOLE
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Navigation item
   ========================================================= */

function SidebarItem({ label, path, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={path}
      end={path === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] transition-all duration-150",
          isActive
            ? "hg-raised border-[rgba(214,169,40,0.28)] bg-[#181818] text-white shadow-[0_0_0_1px_rgba(214,169,40,0.05)]"
            : "text-[#858585] hover:bg-[#151515] hover:text-[#d7d7d7]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={16}
            strokeWidth={isActive ? 2 : 1.7}
            className={
              isActive
                ? "text-[var(--hg-gold-bright)]"
                : "text-[#686868] group-hover:text-[#a0a0a0]"
            }
          />

          <span className="flex-1">{label}</span>

          {isActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--hg-gold-bright)] shadow-[0_0_7px_rgba(240,198,74,0.45)]" />
          )}
        </>
      )}
    </NavLink>
  );
}