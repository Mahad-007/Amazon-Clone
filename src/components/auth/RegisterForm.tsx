"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import { Field } from "@/components/ui/Field";
import { AuthError, AuthShell, SubmitButton } from "./AuthShell";

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState(register, { error: null });

  return (
    <AuthShell
      kicker="Takes ten seconds"
      title="Create account"
      footer={
        <p className="text-[15px]">
          Already have an account?{" "}
          <Link href={`/signin?next=${encodeURIComponent(next)}`} className="link font-semibold">
            Sign in
          </Link>
        </p>
      }
    >
      <form action={action} className="space-y-4">
        <AuthError message={state.error} />
        <input type="hidden" name="next" value={next} />
        <Field label="Your name" name="name" autoComplete="name" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 6 characters"
          required
        />
        <Field label="Re-enter password" name="confirm" type="password" autoComplete="new-password" required />
        <SubmitButton>Create your HAUL account</SubmitButton>
      </form>
    </AuthShell>
  );
}
