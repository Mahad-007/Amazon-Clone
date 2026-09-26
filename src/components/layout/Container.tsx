import type { ReactNode } from "react";

/** The page gutter and max width, in one place. */
export const Container = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-[1320px] px-4 md:px-6 ${className}`}>{children}</div>
);
