import type { ReactNode } from "react";

/**
 * A ticker tape. The content is rendered twice and the track slides by half
 * its width, so the loop is seamless. Pauses on hover; reduced-motion users
 * get a static strip (globals.css).
 */
export const Marquee = ({ children, label }: { children: ReactNode; label: string }) => (
  <section aria-label={label} className="overflow-hidden border-y-[3px] border-ink bg-ink text-paper">
    <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
      <div className="flex shrink-0 items-center">{children}</div>
      <div className="flex shrink-0 items-center" aria-hidden="true">
        {children}
      </div>
    </div>
  </section>
);
