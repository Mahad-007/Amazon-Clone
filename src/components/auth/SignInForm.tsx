"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";
import { Field } from "@/components/ui/Field";
import { buttonStyles } from "@/components/ui/Button";
import { AuthError, AuthShell, SubmitButton } from "./AuthShell";

export function SignInForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, { error: null });

  return (
    <AuthShell
      kicker="Welcome back"
      title="Sign in"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 border-[3px] border-dashed border-ink px-4 py-3">
          <span className="font-display text-[18px] font-bold">New to HAUL?</span>
          <Link
            href={`/register?next=${encodeURIComponent(next)}`}
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            Create an account
          </Link>
        </div>
      }
    >
      <form action={action} className="space-y-4">
        <AuthError message={state.error} />
        <input type="hidden" name="next" value={next} />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton>Sign in</SubmitButton>
        <p className="text-[13px] text-muted">
          Demo store: no real payments are taken and no emails are sent.
        </p>
      </form>
    </AuthShell>
  );
}
