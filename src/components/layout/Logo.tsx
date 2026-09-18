import Link from "next/link";

/** Wordmark + smile curve, drawn inline so it stays crisp at any size. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Amazon home"
      className={`nav-box flex shrink-0 items-center px-2 py-1.5 ${className}`}
    >
      <svg viewBox="0 0 103 32" className="h-[30px] w-[97px]" aria-hidden="true">
        <text
          x="0"
          y="22"
          fill="#ffffff"
          fontSize="27"
          fontWeight="700"
          letterSpacing="-1.2"
          fontFamily="Arial, Helvetica, sans-serif"
        >
          amazon
        </text>
        {/* The smile: a flattened arc from the 'a' to the 'n', with an arrowhead. */}
        <path
          d="M4 26.5c9.5 5.2 33 5.6 46.5-1.1"
          fill="none"
          stroke="#ff9900"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path d="M47 21.6l6.5 2.6-5.2 4.2z" fill="#ff9900" />
      </svg>
      <span className="mt-2 text-[11px] text-white/90">.com</span>
    </Link>
  );
}
