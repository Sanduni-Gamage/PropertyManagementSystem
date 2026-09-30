/**
 * The RentalWise lockup: roof-over-W mark, optionally followed by the wordmark.
 *
 * The mark is inlined rather than loaded from /rentalwise.svg so it scales crisply with
 * the surrounding text and needs no extra request. The same artwork lives in
 * public/rentalwise.svg for the favicon - keep the two paths in step if either changes.
 */
export default function Logo({
  tone = "brand",
  wordmark = "responsive",
  className,
}: {
  /** "light" for the transparent navbar over the home page hero. */
  tone?: "brand" | "light";
  /**
   * "responsive" hides the wordmark below lg. The navbar centres this absolutely between
   * two sets of links, and the full lockup does not fit at narrow desktop widths.
   */
  wordmark?: "responsive" | "always";
  className?: string;
}) {
  const wordTone = tone === "light" ? "text-white" : "text-brand-500";
  const wordVisibility = wordmark === "always" ? "inline" : "hidden lg:inline";

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        viewBox="0 0 96 96"
        aria-hidden="true"
        className="h-7 w-7 shrink-0"
      >
        <rect width="96" height="96" rx="22" fill="#006AFF" />
        <g
          fill="none"
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M24 42 L48 24 L72 42" />
          <path d="M28 50 L37 72 L48 56 L59 72 L68 50" />
        </g>
      </svg>
      <span className={`text-2xl font-bold ${wordTone} ${wordVisibility}`}>RentalWise</span>
    </span>
  );
}
