import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Pill link for departments and filters. `active` fills it with ink;
 * `removable` adds a × for active-filter chips (the whole chip is the link).
 */
export const Chip = ({
  href,
  children,
  active = false,
  removable = false,
  tone = "card",
  className = "",
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
  removable?: boolean;
  tone?: "card" | "pink" | "lime";
  className?: string;
}) => {
  const fill = active ? "bg-ink text-paper" : tone === "pink" ? "bg-pink" : tone === "lime" ? "bg-lime" : "bg-card";
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-ink px-3.5 text-[13px] font-semibold shadow-brut-sm press ${fill} ${className}`}
    >
      {children}
      {removable && (
        <span aria-hidden="true" className="-mr-1 text-[15px] leading-none">
          ×
        </span>
      )}
    </Link>
  );
};
