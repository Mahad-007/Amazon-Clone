import type { ReactNode } from "react";

export type ReceiptRow = { label: ReactNode; value: ReactNode; muted?: boolean };

/**
 * The till-receipt summary shared by the cart and checkout: mono type, dotted
 * leaders, a dashed rule above the total. Plain markup, so it renders the
 * same in a server page or inside the client checkout form.
 *
 * The total's label and amount are siblings in one element on purpose:
 * "Order total" and its value are read together, by people and by tests.
 */
export const Receipt = ({
  title = "Receipt",
  meta,
  rows,
  totalLabel,
  totalValue,
  children,
  footnote,
}: {
  title?: string;
  meta?: ReactNode;
  rows: ReceiptRow[];
  totalLabel: string;
  totalValue: string;
  children?: ReactNode;
  footnote?: ReactNode;
}) => (
  <section aria-label={title} className="border-[3px] border-ink bg-card shadow-brut">
    <div className="flex items-center justify-between gap-3 border-b-[3px] border-ink bg-ink px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-paper">
      <h2>{title}</h2>
      {meta && <span className="text-lime">{meta}</span>}
    </div>

    <div className="px-4 pb-4 pt-3 font-mono text-[13px]">
      <p aria-hidden="true" className="mb-2 text-center text-[11px] tracking-[0.3em] text-muted">
        * * * HAUL * * *
      </p>
      <dl className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className={`flex items-baseline gap-2 ${r.muted ? "text-muted" : ""}`}>
            <dt className="shrink-0">{r.label}</dt>
            <span aria-hidden="true" className="mb-1 min-w-4 flex-1 border-b-2 border-dotted border-ink/30" />
            <dd className="shrink-0 font-bold">{r.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 flex items-baseline justify-between gap-3 border-t-2 border-dashed border-ink pt-3 font-display text-[22px] font-extrabold tracking-tight">
        <span>{totalLabel}</span>
        <span>{totalValue}</span>
      </p>

      {children && <div className="mt-4 space-y-3 font-sans">{children}</div>}
      {footnote && <p className="mt-3 text-[11px] leading-relaxed text-muted">{footnote}</p>}
    </div>
  </section>
);
