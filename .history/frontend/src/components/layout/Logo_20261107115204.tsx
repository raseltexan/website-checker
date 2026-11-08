import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface LogoProps {
  href?: string;
  inverted?: boolean;
  className?: string;
}

/** Brand mark. Replace /public/logo.svg with the official Texan logo file to update it everywhere. */
export function Logo({ href = "/", inverted, className }: LogoProps) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="Texan Website Checker home">
      <Image src="/logo.svg" alt="" width={34} height={34} priority />
      <span className="leading-none">
        <span className={cn("block text-[17px] font-extrabold tracking-tight", inverted ? "text-white" : "text-ink")}>TEXAN</span>
        <span className={cn("block text-[10px] font-bold tracking-[0.2em] uppercase", inverted ? "text-brand" : "text-brand-700")}>Website Checker</span>
      </span>
    </Link>
  );
}
