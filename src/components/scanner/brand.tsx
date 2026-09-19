import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useT } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 shrink-0", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="7" className="fill-surface-2" />
      <rect x="6" y="8" width="8" height="16" rx="1.5" className="fill-accent" />
      <rect x="18" y="14" width="8" height="10" rx="1.5" className="fill-muted" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  return (
    <Link
      to="/"
      aria-label="Carry"
      className="flex min-w-0 shrink-0 items-center gap-2"
    >
      <Logo className={compact ? "size-7" : "size-8"} />
      <span className="min-w-0">
        <span
          className={cn(
            "block font-display font-medium tracking-tight text-fg",
            compact ? "text-lg" : "text-2xl",
          )}
        >
          Carry
        </span>
        {compact ? null : (
          <span className="mt-0.5 block text-pretty text-sm text-muted">
            {t("tagline")}
          </span>
        )}
      </span>
    </Link>
  );
}

export function ResearchLink({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  return (
    <Link
      to="/research"
      aria-label={t("research")}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm text-muted hover:bg-surface-2 hover:text-fg",
        compact ? "size-11 shrink-0 px-0" : "h-11 w-full px-3",
      )}
    >
      {compact ? <Search className="size-4" /> : t("research")}
    </Link>
  );
}

export function GuideLink({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  return (
    <Link
      to="/docs"
      aria-label={t("guide")}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm text-muted hover:bg-surface-2 hover:text-fg",
        compact ? "size-11 shrink-0 px-0" : "h-11 w-full px-3",
      )}
    >
      {compact ? (
        <span className="font-mono text-xs tracking-wide">?</span>
      ) : (
        t("guide")
      )}
    </Link>
  );
}
