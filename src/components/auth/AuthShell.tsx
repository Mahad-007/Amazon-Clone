import Link from "next/link";

/**
 * Amazon's auth pages drop the storefront chrome for a narrow centred card
 * under a dark-on-white logo. Reproduced here so sign-in feels like part of
 * the same product rather than a bolted-on form.
 */
export function AuthShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center bg-white px-4 py-6">
      <Link href="/" aria-label="Amazon home" className="mb-4">
        <svg viewBox="0 0 103 32" className="h-[36px] w-[116px]" aria-hidden="true">
          <text
            x="0"
            y="22"
            fill="#131921"
            fontSize="27"
            fontWeight="700"
            letterSpacing="-1.2"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            amazon
          </text>
          <path
            d="M4 26.5c9.5 5.2 33 5.6 46.5-1.1"
            fill="none"
            stroke="#ff9900"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path d="M47 21.6l6.5 2.6-5.2 4.2z" fill="#ff9900" />
        </svg>
      </Link>

      <div className="w-full max-w-[350px] rounded-lg border border-line bg-white p-5">
        <h1 className="mb-3 text-[28px] font-normal text-ink">{title}</h1>
        {children}
      </div>

      {footer && (
        <div className="w-full max-w-[350px] pt-5 text-center">{footer}</div>
      )}
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[13px] font-bold text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-[3px] border border-[#a6a6a6] px-2 py-1.5 text-[13px] shadow-[inset_0_1px_2px_rgba(0,0,0,.08)] focus:amz-focus"
      />
      {hint && <span className="mt-1 block text-[12px] text-[#565959]">{hint}</span>}
    </label>
  );
}

export function SubmitButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-[8px] border border-[#a88734] bg-cta py-1.5 text-[13px] text-ink shadow-sm hover:bg-cta-hover disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-3 rounded border border-[#c40000] bg-[#fff5f5] p-2.5 text-[13px] text-[#c40000]"
    >
      <strong className="block font-bold">There was a problem</strong>
      {message}
    </div>
  );
}
