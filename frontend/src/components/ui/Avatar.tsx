import { cn } from "@/lib/cn";
import { initials } from "@/utils/format";

export function Avatar({ name, image, className }: { name?: string | null; image?: string | null; className?: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element -- user-provided external avatar URLs
    return <img src={image} alt={name ?? "Avatar"} className={cn("size-9 shrink-0 rounded-full object-cover", className)} />;
  }
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-brand text-xs font-extrabold text-ink", className)} aria-hidden>
      {initials(name)}
    </span>
  );
}
