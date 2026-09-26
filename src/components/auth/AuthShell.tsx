"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Wordmark } from "@/components/layout/Wordmark";
import { buttonStyles } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";

/**
 * Split screen: a loud poster panel on the left, a plain form on the right.
 * Below lg the poster shrinks to a banner above the form.
 */
export function AuthShell({
  title,
  kicker,
  children,
  footer,
}: {
  title: string;
  kicker: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-[1320px] gap-6 px-4 py-8 md:px-6 md:py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
      <section
        aria-hidden="true"
        className="brut relative flex min-h-[200px] flex-col justify-between overflow-hidden bg-pink p-6 md:p-10 lg:min-h-[560px]"
      >
        <div className="dot-grid absolute inset-0 opacity-[0.14]" />
        <div className="relative">
          <Wordmark size="lg" href={null} />
        </div>
        <p className="relative mt-8 font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.035em] md:text-[72px]">
          Your haul
          <br />
          is waiting.
        </p>
        <ul className="relative mt-8 hidden flex-wrap gap-2 font-mono text-[11px] font-bold uppercase lg:flex">
          {["Carts follow you", "One-page checkout", "Order history", "Real reviews"].map((t, i) => (
            <li
              key={t}
              className={`border-2 border-ink px-2 py-1 shadow-brut-sm ${i % 2 ? "bg-lime" : "bg-card"}`}
            >
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col justify-center">
        <div className="brut bg-card p-6 md:p-8">
          <p className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-muted">{kicker}</p>
          <h1 className="mt-2 font-display text-[36px] font-extrabold leading-none tracking-tight md:text-[44px]">
            {title}
          </h1>
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6">{footer}</div>}
      </section>
    </div>
  );
}

/** Must be rendered inside the <form>, so it can read the pending state. */
export function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonStyles({ size: "lg", block: true })}>
      {pending ? "Please wait…" : children}
    </button>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return <FormError>{message}</FormError>;
}
