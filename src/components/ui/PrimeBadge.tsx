/** The Prime checkmark swoosh, as an inline SVG so it scales with text. */
export function PrimeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      aria-label="Prime delivery"
    >
      <svg
        viewBox="0 0 48 16"
        className="h-[13px] w-[39px]"
        aria-hidden="true"
      >
        <text
          x="0"
          y="12"
          fill="#232f3e"
          fontSize="13"
          fontWeight="700"
          fontFamily="Arial, sans-serif"
        >
          prime
        </text>
        <path
          d="M2 14.5c8 3.5 26 3.5 36-2"
          fill="none"
          stroke="#00a8e1"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
