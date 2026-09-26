import type { ReactNode } from "react";

/** A bordered box with an optional ink title bar, for filters, forms and summaries. */
export const Panel = ({
  title,
  aside,
  children,
  className = "",
  bodyClassName = "p-4",
  tone = "card",
  as: Tag = "section",
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  tone?: "card" | "lime" | "paper";
  as?: "section" | "div" | "aside";
}) => (
  <Tag className={`brut ${tone === "lime" ? "bg-lime" : tone === "paper" ? "bg-paper" : "bg-card"} ${className}`}>
    {title && (
      <div className="flex items-center justify-between gap-2 border-b-[3px] border-ink bg-ink px-4 py-2 text-paper">
        <h2 className="font-mono text-[12px] font-bold uppercase tracking-[0.14em]">{title}</h2>
        {aside}
      </div>
    )}
    <div className={bodyClassName}>{children}</div>
  </Tag>
);
