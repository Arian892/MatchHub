"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Profile, Result } from "@/lib/types";
import { cn, colorFor, contrastInk, initials } from "@/lib/utils";

/* ------------------------------------------------------------------ */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  full?: boolean;
};

export function Button({
  variant = "outline",
  size = "md",
  full = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition",
        "disabled:cursor-not-allowed disabled:opacity-45",
        full && "w-full",
        size === "sm" && "h-9 px-3.5 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        variant === "primary" && "bg-amber text-[#12142A] active:scale-[0.98]",
        variant === "outline" && "border border-line bg-surface text-ink active:scale-[0.98]",
        variant === "ghost" && "text-muted active:bg-raised",
        variant === "danger" && "border border-loss/40 bg-loss/10 text-loss",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ */

export function Avatar({
  profile,
  size = 40,
}: {
  profile: Pick<Profile, "id" | "username"> | undefined | null;
  size?: number;
}) {
  const color = profile ? colorFor(profile.id) : "#8A93AD";
  return (
    <span
      aria-hidden
      className="score-type inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none"
      style={{
        width: size,
        height: size,
        background: color,
        color: contrastInk(color),
        fontSize: size * 0.42,
      }}
    >
      {initials(profile?.username ?? "?")}
    </span>
  );
}

/* ------------------------------------------------------------------ */

const resultStyle: Record<Result, string> = {
  W: "bg-win/15 text-win border-win/35",
  D: "bg-draw/15 text-draw border-draw/35",
  L: "bg-loss/15 text-loss border-loss/35",
};

export function FormPill({ result, size = 28 }: { result: Result; size?: number }) {
  return (
    <span
      className={cn(
        "score-type inline-flex items-center justify-center rounded-[7px] border font-semibold",
        resultStyle[result],
      )}
      style={{ width: size, height: size, fontSize: size * 0.55 }}
      title={result === "W" ? "Win" : result === "D" ? "Draw" : "Loss"}
    >
      {result}
    </span>
  );
}

export function FormRun({
  form,
  size = 28,
  empty = "No matches yet",
}: {
  form: Result[];
  size?: number;
  empty?: string;
}) {
  if (form.length === 0) return <span className="text-sm text-faint">{empty}</span>;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {form.map((r, i) => (
        <FormPill key={i} result={r} size={size} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] leading-none text-muted">{label}</span>
      <span
        className="score-type text-3xl font-semibold leading-none"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
      {sub ? <span className="text-xs text-faint">{sub}</span> : null}
    </div>
  );
}

export function SplitBar({
  won,
  drawn,
  lost,
  height = 12,
}: {
  won: number;
  drawn: number;
  lost: number;
  height?: number;
}) {
  const total = won + drawn + lost;
  const share = (v: number) => (total ? (v / total) * 100 : 0);
  return (
    <div className="flex w-full overflow-hidden rounded-full bg-raised" style={{ height }}>
      <div
        className="origin-left animate-grow bg-win"
        style={{ width: `${share(won)}%` }}
      />
      <div
        className="origin-left animate-grow bg-draw/60"
        style={{ width: `${share(drawn)}%` }}
      />
      <div
        className="origin-right animate-grow bg-loss"
        style={{ width: `${share(lost)}%` }}
      />
    </div>
  );
}

/** One metric, two mirrored bars: me on the left, them on the right. */
export function MirrorMetric({
  label,
  mine,
  theirs,
  myColor,
  theirColor,
  format = (n: number) => String(n),
}: {
  label: string;
  mine: number;
  theirs: number;
  myColor: string;
  theirColor: string;
  format?: (n: number) => string;
}) {
  const max = Math.max(mine, theirs, 0.0001);
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="flex items-center justify-end gap-2">
        <span className="score-type text-lg font-semibold tabular">{format(mine)}</span>
        <div className="h-2.5 w-full max-w-[120px] overflow-hidden rounded-full bg-raised">
          <div
            className="ml-auto h-full origin-right animate-grow rounded-full"
            style={{ width: `${(mine / max) * 100}%`, background: myColor }}
          />
        </div>
      </div>
      <span className="whitespace-nowrap px-1 text-center text-xs text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-full max-w-[120px] overflow-hidden rounded-full bg-raised">
          <div
            className="h-full origin-left animate-grow rounded-full"
            style={{ width: `${(theirs / max) * 100}%`, background: theirColor }}
          />
        </div>
        <span className="score-type text-lg font-semibold tabular">{format(theirs)}</span>
      </div>
    </div>
  );
}

export function WinRateDial({
  value,
  color,
  size = 110,
  caption,
}: {
  value: number;
  color: string;
  size?: number;
  caption?: string;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(Math.max(value, 0), 100) / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgb(var(--line))"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <span className="score-type absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular">
          {Math.round(value)}%
        </span>
      </div>
      {caption ? <span className="text-xs text-muted">{caption}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[#070915]/75 backdrop-blur-sm"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[92vh] w-full animate-sheet flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-lift sm:max-w-md sm:rounded-card"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="score-type text-2xl font-semibold leading-none">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted active:bg-raised"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <footer className="border-t border-line bg-raised/50 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export const inputClass =
  "w-full rounded-xl border border-line bg-raised px-3.5 py-3 text-base text-ink outline-none transition placeholder:text-faint focus:border-amber/70";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

export function Notice({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <p
      role="status"
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-sm",
        tone === "error"
          ? "border-loss/40 bg-loss/10 text-loss"
          : "border-win/40 bg-win/10 text-win",
      )}
    >
      {children}
    </p>
  );
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line px-6 py-12 text-center">
      <p className="score-type text-2xl font-semibold leading-none">{title}</p>
      <p className="max-w-xs text-sm text-muted">{body}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-raised", className)} />;
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="score-type text-xl font-semibold leading-none">{title}</h2>
      {action}
    </div>
  );
}
