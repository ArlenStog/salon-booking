import type { ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const styles =
    variant === "primary"
      ? "bg-ink text-paper hover:bg-accent"
      : "border border-ink text-ink hover:bg-ink hover:text-paper";
  return (
    <button
      className={`inline-flex items-center justify-center px-6 py-3 font-mono text-xs uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
      {...props}
    />
  );
}

export function Input({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        className="mt-1 w-full border-0 border-b border-ink/30 bg-transparent px-0 py-2 text-lg outline-none transition-colors placeholder:text-muted/60 focus:border-ink"
        {...props}
      />
    </label>
  );
}

export function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`border border-rule p-6 sm:p-8 ${className}`}>{children}</div>;
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-accent">
      {children}
    </p>
  );
}

/** "01 — Service" style section heading used in multi-step screens. */
export function StepHeading({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-baseline gap-3 border-b border-ink pb-2">
      <span className="font-mono text-xs text-muted">{n}</span>
      <span className="font-display text-2xl">{children}</span>
    </h2>
  );
}
