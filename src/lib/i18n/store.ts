import { create } from "zustand";
import { persist } from "zustand/middleware";
import { messages, type Locale, type MessageKey } from "./messages";

type I18nState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      locale: "fr",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "ecart-locale", partialize: (state) => ({ locale: state.locale }) },
  ),
);

export function t(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let text: string = messages[locale][key] ?? messages.fr[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function useT() {
  const locale = useI18n((s) => s.locale);
  return {
    locale,
    t: (key: MessageKey, vars?: Record<string, string | number>) =>
      t(locale, key, vars),
  };
}

export function numberLocale(locale: Locale): string {
  return locale === "fr" ? "fr-FR" : "en-US";
}
