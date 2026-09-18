import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Posted from the account flyout, which renders on every page. */
export async function POST(request: Request) {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
