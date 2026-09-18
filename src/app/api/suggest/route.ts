import { NextResponse } from "next/server";
import { suggestions } from "@/lib/catalog";

// Reads the query string on every call, so it must not be statically cached.
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json({ suggestions: suggestions(q) });
}
