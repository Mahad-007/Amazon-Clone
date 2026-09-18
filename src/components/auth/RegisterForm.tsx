"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import { AuthShell, AuthError, Field, SubmitButton } from "./AuthShell";

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(register, { error: null });

  return (
    <AuthShell
      title="Create account"
      footer={
        <p className="text-[13px] text-ink">
          Already have an account?{" "}
          <Link
            href={`/signin?next=${encodeURIComponent(next)}`}
            className="link-teal"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form action={action}>
        <AuthError message={state.error} />
        <input type="hidden" name="next" value={next} />

        <Field label="Your name" name="name" autoComplete="name" />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 6 characters"
        />
        <Field
          label="Re-enter password"
          name="confirm"
          type="password"
          autoComplete="new-password"
        />

        <SubmitButton pending={pending}>Create your Amazon account</SubmitButton>
      </form>
    </AuthShell>
  );
}
