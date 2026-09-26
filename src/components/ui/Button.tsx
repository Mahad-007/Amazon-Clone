import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "pink" | "ink" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-lime text-ink",
  secondary: "bg-card text-ink",
  pink: "bg-pink text-ink",
  ink: "bg-ink text-lime",
  ghost: "bg-transparent text-ink",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-7 text-[17px]",
};

/**
 * The one button look: a flat colour block with an ink border and a hard
 * shadow that it sinks into when pressed. Exported as a class builder so
 * links, submit buttons and <summary> elements can all share it.
 */
export const buttonStyles = ({
  variant = "primary",
  size = "md",
  block = false,
}: { variant?: Variant; size?: Size; block?: boolean } = {}) =>
  [
    "inline-flex items-center justify-center gap-2 rounded-brut border-[3px] border-ink font-display font-bold tracking-tight",
    variant === "ghost" ? "border-transparent" : "shadow-brut press",
    "disabled:cursor-not-allowed disabled:opacity-60",
    VARIANTS[variant],
    SIZES[size],
    block ? "w-full" : "",
  ].join(" ");

type Style = { variant?: Variant; size?: Size; block?: boolean };

export const Button = ({
  variant,
  size,
  block,
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & Style) => (
  <button type={type} className={`${buttonStyles({ variant, size, block })} ${className}`} {...props} />
);

export const ButtonLink = ({
  variant,
  size,
  block,
  className = "",
  ...props
}: ComponentProps<typeof Link> & Style) => (
  <Link className={`${buttonStyles({ variant, size, block })} ${className}`} {...props} />
);
