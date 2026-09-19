import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowLeft, ArrowUpRight } from "lucide-react";
import { DOCS } from "@/lib/i18n/docs";
import { useT } from "@/lib/i18n/store";
import { Brand, ResearchLink } from "./brand";
import { LanguageSwitch } from "./language-switch";
import { cn } from "@/lib/utils";

export function DocsPage() {
  const { locale, t } = useT();
  const copy = DOCS[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Brand compact />
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitch compact />
            <ResearchLink compact />
            <Link
              to="/"
              className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm text-muted hover:bg-surface-2 hover:text-fg"
            >
              <ArrowLeft className="size-4" />
              {t("backToScan")}
            </Link>
          </div>
        </div>
      </header>

      <article className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-col gap-3">
          <p className="text-xs font-medium tracking-wider text-subtle uppercase">
            {copy.kicker}
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight text-fg sm:text-4xl">
            {copy.title}
          </h1>
          <p className="text-pretty text-base text-muted">{copy.lead}</p>
        </header>

        <nav aria-label={copy.kicker} className="flex flex-wrap gap-2">
          {copy.sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full bg-surface px-3 py-1.5 text-xs text-muted shadow-border hover:text-fg"
            >
              {section.title}
            </a>
          ))}
        </nav>

        {copy.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="font-display text-xl font-medium tracking-tight text-fg">
              {section.title}
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {section.blocks.map((block, i) => (
                <Block key={`${section.id}-${i}`} block={block} />
              ))}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}

function Block({ block }: { block: (typeof DOCS)["fr"]["sections"][0]["blocks"][0] }) {
  if (block.type === "p") {
    return <p className="text-pretty text-sm leading-relaxed text-muted">{block.text}</p>;
  }
  if (block.type === "ul") {
    return (
      <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted">
        {block.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
            <span className="text-pretty">{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "callout") {
    return (
      <p className="rounded-xl bg-surface px-4 py-3 text-pretty text-sm text-fg shadow-border">
        {block.text}
      </p>
    );
  }
  return <SignExample />;
}

function SignExample() {
  const { locale } = useT();
  const fr = locale === "fr";
  return (
    <div className="rounded-xl bg-surface p-4 shadow-border sm:p-5">
      <p className="text-xs font-medium tracking-wider text-subtle uppercase">
        {fr ? "Exemple" : "Example"}
      </p>
      <p className="mt-2 text-sm text-muted">
        {fr
          ? "Le DEX affiche +80 % APR (les longs paient)."
          : "The DEX prints +80% APR (longs pay)."}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ExampleLeg
          side="long"
          venue="Hyperliquid"
          ticker={fr ? "ticker +80 %" : "ticker +80%"}
          pnl="-80.0 %"
        />
        <ExampleLeg
          side="short"
          venue="Hyperliquid"
          ticker={fr ? "ticker +80 %" : "ticker +80%"}
          pnl="+80.0 %"
        />
      </div>
      <p className="mt-4 font-mono text-xs text-muted">
        {fr
          ? "Carry LONG −80 % · Carry SHORT +80 % · même marché, deux lectures."
          : "Carry LONG −80% · Carry SHORT +80% · same market, two readings."}
      </p>
    </div>
  );
}

function ExampleLeg({
  side,
  venue,
  ticker,
  pnl,
}: {
  side: "long" | "short";
  venue: string;
  ticker: string;
  pnl: string;
}) {
  const { t } = useT();
  const Icon = side === "long" ? ArrowUpRight : ArrowDownRight;
  const positive = pnl.startsWith("+");
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-subtle" />
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wider text-subtle uppercase">
            {t(side === "long" ? "long" : "short")}
          </p>
          <p className="truncate text-sm text-fg">{venue}</p>
          <p className="font-mono text-xs text-subtle tabular-nums">{ticker}</p>
        </div>
      </div>
      <p
        className={cn(
          "font-mono text-sm tabular-nums",
          positive ? "text-gain" : "text-loss",
        )}
      >
        {pnl}
      </p>
    </div>
  );
}
