import Link from "next/link";

/** The HAUL wordmark: lime letters in an ink block with a hard shadow. */
export const Wordmark = ({ size = "md", href = "/" }: { size?: "md" | "lg" | "xl"; href?: string | null }) => {
  const scale = {
    md: "px-2.5 py-0.5 text-[26px] shadow-brut-sm",
    lg: "px-4 py-1 text-[44px] shadow-brut",
    xl: "px-5 py-1 text-[72px] shadow-brut-lg md:text-[120px]",
  }[size];
  const mark = (
    <span
      className={`inline-block -rotate-2 border-[3px] border-ink bg-ink font-display font-extrabold leading-none tracking-[-0.04em] text-lime ${scale}`}
    >
      HAUL
    </span>
  );
  if (href === null) return mark;
  return (
    <Link href={href} aria-label="HAUL home" className="shrink-0">
      {mark}
    </Link>
  );
};
