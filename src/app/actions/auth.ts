"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mergeGuestCart } from "@/lib/cart";

export type AuthState = { error: string | null };

/** Keeps an open redirect from being smuggled in through ?next=. */
function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) {
    return "Your email or password is incorrect.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "An account with that email already exists. Try signing in.";
  }
  if (m.includes("password")) {
    return "Passwords must be at least 6 characters.";
  }
  if (m.includes("email")) return "Please enter a valid email address.";
  return "Something went wrong. Please try again.";
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Sign-in is unavailable right now." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: friendly(error.message) };

  // Fold anything added as a guest into the account's cart.
  if (data.user) await mergeGuestCart(data.user.id);

  redirect(next);
}

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Registration is unavailable right now." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const next = safeNext(formData.get("next"));

  if (!name) return { error: "Enter your name." };
  if (password.length < 6) {
    return { error: "Passwords must be at least 6 characters." };
  }
  if (password !== confirm) return { error: "Passwords must match." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) return { error: friendly(error.message) };

  if (data.user) await mergeGuestCart(data.user.id);

  redirect(next);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
