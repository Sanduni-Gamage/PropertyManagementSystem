import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Shared building blocks for the tenant and maintenance screens.
 *
 * These exist so the long Tailwind strings live in one place: without them, "a card" is
 * eight utility classes repeated across a dozen files and the screens drift apart the first
 * time one of them is edited.
 */

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** White panel on the page wash. The default surface for everything. */
export function Card({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-xl border border-line bg-white shadow-card",
        interactive && "transition hover:border-line-strong hover:shadow-raised",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700",
  secondary: "bg-white text-brand-500 border border-brand-500 hover:bg-brand-50",
  ghost: "bg-transparent text-ink-muted border border-line hover:bg-surface-sunken",
  danger: "bg-critical-600 text-white hover:bg-critical-700",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold",
        "transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

export type BadgeTone = "neutral" | "info" | "positive" | "caution" | "critical";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-sunken text-ink-muted",
  info: "bg-brand-50 text-brand-700",
  positive: "bg-positive-50 text-positive-700",
  caution: "bg-caution-50 text-caution-600",
  critical: "bg-critical-50 text-critical-700",
};

/** Small status pill. Keep the label to one or two words. */
export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Headline number with a quiet label underneath. */
export function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-3xl font-bold leading-none text-ink">{value}</p>
      <p className="mt-2 text-sm text-ink-subtle">{label}</p>
    </Card>
  );
}

/** Section title with an optional action on the right. */
export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {action}
    </div>
  );
}

/** Full-width callout for safety warnings and status notices. */
export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: BadgeTone;
  title?: string;
  children: ReactNode;
}) {
  const styles: Record<BadgeTone, string> = {
    neutral: "border-line bg-surface-sunken text-ink-muted",
    info: "border-brand-200 bg-brand-50 text-brand-700",
    positive: "border-positive-600/30 bg-positive-50 text-positive-700",
    caution: "border-caution-600/30 bg-caution-50 text-caution-600",
    critical: "border-critical-600/40 bg-critical-50 text-critical-700",
  };

  return (
    <div className={cx("rounded-xl border p-4", styles[tone])}>
      {title && <p className="font-bold">{title}</p>}
      <div className={cx("text-sm", title && "mt-1")}>{children}</div>
    </div>
  );
}

/** Centred empty state with an optional call to action. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="px-6 py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-ink-subtle">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  );
}
