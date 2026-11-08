import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input } from "./Input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search…", className }: SearchInputProps) {
  return (
    <div className={cn("w-full sm:w-72", className)}>
      <Input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} leftIcon={<Search />} aria-label={placeholder} />
    </div>
  );
}

/** Toolbar row above tables: search on the left, filters/actions on the right. */
export function TableToolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">{children}</div>;
}
