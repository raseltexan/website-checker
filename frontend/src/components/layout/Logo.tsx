import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { logo } from "../../../public/images";

interface LogoProps {
  href?: string;
  inverted?: boolean;
  className?: string;
}

/** Brand mark. Replace /public/logo.svg with the official Texan logo file to update it everywhere. */
export function Logo({ href = "/", inverted, className }: LogoProps) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="Texan Website Checker home">
      <Image src={logo} alt="" width={200} height={200} priority />
      
    </Link>
  );
}
