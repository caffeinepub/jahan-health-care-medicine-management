import {
  Activity,
  Ambulance,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  Cross,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Package,
  Pill,
  Send,
  Stethoscope,
  Truck,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { PageKey } from "../lib/helpers";

const DEPT_PAGES: { key: PageKey; label: string; icon: React.ReactNode }[] = [
  { key: "dist-OT", label: "OT", icon: <FlaskConical size={14} /> },
  { key: "dist-Ward", label: "Ward", icon: <Stethoscope size={14} /> },
  { key: "dist-ICU", label: "ICU", icon: <Cross size={14} /> },
  { key: "dist-Emergency", label: "Emergency", icon: <Ambulance size={14} /> },
  { key: "dist-OPD", label: "OPD", icon: <Pill size={14} /> },
];

interface LayoutProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: React.ReactNode;
}

export function Layout({ activePage, onNavigate, children }: LayoutProps) {
  const [distExpanded, setDistExpanded] = useState(
    activePage.startsWith("dist-"),
  );

  const NavItem = ({
    pageKey,
    icon,
    label,
  }: { pageKey: PageKey; icon: React.ReactNode; label: string }) => {
    const isActive = activePage === pageKey;
    return (
      <button
        type="button"
        data-ocid={`nav.${pageKey}.link`}
        onClick={() => onNavigate(pageKey)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        }`}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
      </button>
    );
  };

  const isDistActive = activePage.startsWith("dist-");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-sidebar flex flex-col overflow-y-auto">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sidebar-foreground font-bold text-xs leading-tight">
                Jahan Health Care
              </p>
              <p className="text-sidebar-foreground/60 text-[10px] leading-tight">
                Medicine Management
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <NavItem
            pageKey="dashboard"
            icon={<LayoutDashboard size={16} />}
            label="Dashboard"
          />
          <NavItem
            pageKey="stock"
            icon={<Package size={16} />}
            label="Medicine Stock"
          />
          <NavItem
            pageKey="suppliers"
            icon={<Truck size={16} />}
            label="Suppliers"
          />
          <NavItem
            pageKey="bills"
            icon={<FileText size={16} />}
            label="Bills & Payments"
          />

          {/* Distribution expandable */}
          <div>
            <button
              type="button"
              onClick={() => setDistExpanded(!distExpanded)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isDistActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Send size={16} className="flex-shrink-0" />
              <span className="flex-1 text-left">Distribution</span>
              {distExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
            <AnimatePresence initial={false}>
              {distExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden ml-4 mt-1 space-y-0.5"
                >
                  {DEPT_PAGES.map((d) => (
                    <NavItem
                      key={d.key}
                      pageKey={d.key}
                      icon={d.icon}
                      label={d.label}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavItem
            pageKey="reports"
            icon={<BarChart3 size={16} />}
            label="Reports"
          />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-sidebar-foreground/40 text-[10px] text-center">
            &copy; {new Date().getFullYear()}{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Jahan Health Care Nursing Home
            </h1>
            <p className="text-xs text-muted-foreground">
              Medicine Management System
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative p-2 rounded-lg hover:bg-accent transition-colors"
              data-ocid="header.notifications.button"
            >
              <Bell size={18} className="text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent">
              <User size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
