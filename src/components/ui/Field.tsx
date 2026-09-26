import type { ComponentProps, ReactNode } from "react";

export const inputStyles =
  "h-12 w-full rounded-brut border-[3px] border-ink bg-card px-3 text-[15px] text-ink placeholder:text-muted/70 focus:bg-paper focus:outline-none focus-visible:shadow-brut-sm focus-visible:outline-none";

/** Label + input + optional hint. Labels are mono caps, like form stencils. */
export const Field = ({
  label,
  hint,
  className = "",
  ...input
}: ComponentProps<"input"> & { label: ReactNode; hint?: ReactNode }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block font-mono text-[12px] font-bold uppercase tracking-wider">{label}</span>
    <input className={inputStyles} {...input} />
    {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
  </label>
);

export const FormError = ({ children }: { children: ReactNode }) => (
  <p role="alert" className="border-[3px] border-ink bg-pink px-3 py-2 text-[14px] font-semibold text-ink">
    {children}
  </p>
);
