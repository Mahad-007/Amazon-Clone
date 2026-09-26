import { Container } from "@/components/layout/Container";

/**
 * The shape of a product grid, blocking in. Used as loading.tsx only on
 * public grid routes (search, deals). A root-level loading.tsx would make
 * every route stream, which turns the server redirects on auth-gated pages
 * (checkout, orders, account) into late client-side redirects instead of
 * plain 307s, and those must work without JavaScript.
 */
export function GridSkeleton() {
  return (
    <Container className="pt-8">
      <div role="status" aria-live="polite" className="animate-pulse">
        <span className="sr-only">Loading…</span>
        <div className="h-14 w-2/3 max-w-lg border-[3px] border-ink bg-paper-deep" />
        <div className="mt-3 h-5 w-1/3 max-w-xs border-2 border-ink bg-paper-deep" />
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="border-[3px] border-ink bg-card shadow-brut">
              <div className="aspect-square border-b-[3px] border-ink bg-paper-deep" />
              <div className="space-y-2 p-3.5">
                <div className="h-3 w-1/3 bg-paper-deep" />
                <div className="h-4 w-full bg-paper-deep" />
                <div className="h-4 w-2/3 bg-paper-deep" />
                <div className="h-6 w-1/3 bg-paper-deep" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
