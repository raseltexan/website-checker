import {
  Activity,
  BarChart3,
  Bell,
  CreditCard,
  FileText,
  Globe,
  HeartPulse,
  History,
  LayoutDashboard,
  ListChecks,
  Mail,
  MonitorSmartphone,
  ScanSearch,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const ADMIN_BASE = "/dashboard/admin";

export const userNav: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Website Checker", href: "/dashboard/checker", icon: ScanSearch },
      { label: "Scan History", href: "/dashboard/scans", icon: History },
      { label: "Websites", href: "/dashboard/websites", icon: Globe },
      { label: "Audit Reports", href: "/dashboard/reports", icon: FileText },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
      { label: "Profile", href: "/dashboard/profile", icon: User },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
    ],
  },
];

export const adminNav: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Analytics", href: ADMIN_BASE, icon: BarChart3 }],
  },
  {
    title: "Management",
    items: [
      { label: "Users", href: `${ADMIN_BASE}/users`, icon: Users },
      { label: "Websites", href: `${ADMIN_BASE}/websites`, icon: Globe },
      { label: "Scans", href: `${ADMIN_BASE}/scans`, icon: ScanSearch },
      { label: "Reports", href: `${ADMIN_BASE}/reports`, icon: FileText },
      { label: "Subscriptions & Plans", href: `${ADMIN_BASE}/subscriptions`, icon: CreditCard },
    ],
  },
  {
    title: "Audit Engine",
    items: [
      { label: "Checker Categories", href: `${ADMIN_BASE}/checkers`, icon: ListChecks },
      { label: "Audit Configuration", href: `${ADMIN_BASE}/audit-config`, icon: SlidersHorizontal },
      { label: "Browser & Device", href: `${ADMIN_BASE}/browser-testing`, icon: MonitorSmartphone },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { label: "Email & SMTP", href: `${ADMIN_BASE}/email`, icon: Mail },
      { label: "Security", href: `${ADMIN_BASE}/security`, icon: ShieldCheck },
      { label: "Notifications", href: `${ADMIN_BASE}/notifications`, icon: Bell },
      { label: "Activity Logs", href: `${ADMIN_BASE}/activity-logs`, icon: Activity },
      { label: "System Health", href: `${ADMIN_BASE}/system-health`, icon: HeartPulse },
      { label: "Admin Settings", href: `${ADMIN_BASE}/settings`, icon: Settings },
    ],
  },
];

export const isActivePath = (pathname: string, href: string) =>
  href === "/dashboard" || href === ADMIN_BASE ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

