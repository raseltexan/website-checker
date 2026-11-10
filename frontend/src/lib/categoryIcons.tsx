import { createElement } from "react";
import { Accessibility, CircleCheck, Gauge, Link2, Lock, Mail, Monitor, Ruler, Search, Shield, Smartphone, type LucideIcon } from "lucide-react";

/** Maps the backend category `icon` key to a Lucide icon. */
const ICONS: Record<string, LucideIcon> = {
  search: Search,
  gauge: Gauge,
  shield: Shield,
  lock: Lock,
  accessibility: Accessibility,
  link: Link2,
  smartphone: Smartphone,
  mail: Mail,
  monitor: Monitor,
  layout: Ruler,
};

/** Renders the icon for a checker category key (stable component, safe for the React Compiler). */
export function CategoryIcon({ icon, className }: { icon?: string; className?: string }) {
  return createElement((icon && ICONS[icon]) || CircleCheck, { className });
}
