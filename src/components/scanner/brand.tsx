import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";

export function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  return (
    <Link to="/" className="min-w-0 block">
      <p className="font-display text-2xl font-medium tracking-tight text-fg">
        Carry
      </p>
      {compact ? null : (
        <p className="mt-1 text-pretty text-sm text-muted">{t("tagline")}</p>
      )}
    </Link>
  );
}

export function GuideLink({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  return (
    <Link
      to="/docs"
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-md px-3 text-sm text-muted hover:bg-surface-2 hover:text-fg",
        compact ? "h-11 w-11 px-0" : "w-full",
      )}
    >
      {compact ? (
        <>
          <span className="font-mono text-xs tracking-wide">?</span>
          <span className="sr-only">{t("guide")}</span>
        </>
      ) : (
        t("guide")
      )}
    </Link>
  );
}
