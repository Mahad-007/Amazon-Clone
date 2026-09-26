import type { ReactNode } from "react";

type Tone = "pink" | "lime" | "sun" | "ink" | "cobalt" | "card";

const TONES: Record<Tone, string> = {
  pink: "bg-pink text-ink",
  lime: "bg-lime text-ink",
  sun: "bg-sun text-ink",
  ink: "bg-ink text-lime",
  cobalt: "bg-cobalt text-white",
  card: "bg-card text-ink",
};

/** A small rotated label that looks slapped on: discounts, badges, statuses. */
export const Sticker = ({
  children,
  tone = "pink",
  tilt = -3,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  /** Degrees; 0 for a flat label. */
  tilt?: number;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center gap-1 border-2 border-ink px-2 py-0.5 font-mono text-[11px] font-bold uppercase leading-5 tracking-wide shadow-brut-sm ${TONES[tone]} ${className}`}
    style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
  >
    {children}
  </span>
);
