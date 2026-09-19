import { LOCALES, LOCALE_LABEL } from "@/lib/i18n/messages";
import { useI18n, useT } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  const locale = useI18n((s) => s.locale);
  const setLocale = useI18n((s) => s.setLocale);
  const other = locale === "fr" ? "en" : "fr";

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setLocale(other)}
        aria-label={t("language")}
        title={LOCALE_LABEL[other]}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-2 text-xs font-medium text-fg"
      >
        {LOCALE_LABEL[locale]}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="grid w-full grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1"
    >
      {LOCALES.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setLocale(id)}
          className={cn(
            "h-9 rounded-md text-xs font-medium transition-[background-color,color] duration-[var(--motion-quick)]",
            locale === id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
          )}
        >
          {LOCALE_LABEL[id]}
        </button>
      ))}
    </div>
  );
}
