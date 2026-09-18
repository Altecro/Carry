import { LOCALES, LOCALE_LABEL } from "@/lib/i18n/messages";
import { useI18n, useT } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  const locale = useI18n((s) => s.locale);
  const setLocale = useI18n((s) => s.setLocale);

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1",
        compact ? "w-24" : "w-full",
      )}
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
