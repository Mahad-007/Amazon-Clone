import Link from "next/link";
import type { ReactNode } from "react";

/** "01 / Trending now ———— See all →" — numbered, editorial section titles. */
export const SectionHeading = ({
  index,
  title,
  href,
  linkLabel = "See all",
  as: Tag = "h2",
  children,
}: {
  index?: string;
  title: ReactNode;
  href?: string;
  linkLabel?: string;
  as?: "h1" | "h2" | "h3";
  children?: ReactNode;
}) => (
  <div className="mb-5 flex flex-wrap items-end gap-x-4 gap-y-2">
    <Tag className="flex items-baseline gap-3 font-display text-[28px] font-extrabold leading-none tracking-tight md:text-[36px]">
      {index && <span className="font-mono text-[14px] font-bold text-muted md:text-[15px]">{index} /</span>}
      {title}
    </Tag>
    {children}
    <span aria-hidden="true" className="mb-2 hidden h-[3px] flex-1 bg-ink sm:block" />
    {href && (
      <Link href={href} className="link font-mono text-[13px] font-bold uppercase">
        {linkLabel} →
      </Link>
    )}
  </div>
);
