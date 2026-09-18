"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";
import { AuthShell, AuthError, Field, SubmitButton } from "./AuthShell";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, { error: null });

  return (
    <AuthShell
      title="Sign in"
      footer={
        <>
          <div className="relative mb-4">
            <span className="block border-t border-line" />
            <span className="absolute left-1/2 top-[-9px] -translate-x-1/2 bg-white px-2 text-[12px] text-[#767676]">
              New to Amazon?
            </span>
          </div>
          <Link
            href={`/register?next=${encodeURIComponent(next)}`}
            className="block rounded-[8px] border border-line bg-[#f0f2f2] py-1.5 text-[13px] text-ink hover:bg-[#e3e6e6]"
          >
            Create your Amazon account
          </Link>
        </>
      }
    >
      <form action={action}>
        <AuthError message={state.error} />
        <input type="hidden" name="next" value={next} />

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
          autoComplete="current-password"
        />

        <SubmitButton pending={pending}>Sign in</SubmitButton>

        <p className="mt-4 text-[12px] leading-4 text-ink">
          By continuing, you agree to this demo&apos;s{" "}
          <span className="link-teal">Conditions of Use</span> and{" "}
          <span className="link-teal">Privacy Notice</span>.
        </p>
      </form>
    </AuthShell>
  );
}
