/** HAUL Express: 2-day shipping. A lime bolt tag. */
export const ExpressBadge = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-flex items-center gap-1 border-2 border-ink bg-lime px-1.5 font-mono text-[10px] font-bold uppercase leading-[18px] tracking-wider text-ink ${className}`}
  >
    <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
      <path fill="currentColor" d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
    Express
  </span>
);
