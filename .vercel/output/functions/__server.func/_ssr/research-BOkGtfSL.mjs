import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { l as ArrowLeft } from "../_libs/lucide-react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as cn } from "./router-CWg1nYs3.mjs";
import { n as GuideLink, r as LanguageSwitch, s as useT, t as Brand } from "./language-switch-3fae6Zdy.mjs";
import { a as Skeleton, d as fmtUsd, f as runScan, i as OpportunityCard, l as findResearchPairs, m as useResearch, o as SpreadChart, p as useFilters, r as Input, s as VENUES, t as Button } from "./spread-chart-BrcNkmRI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/research-BOkGtfSL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ResearchPage() {
	const { locale, t } = useT();
	const filters = useFilters();
	const research = useResearch();
	const [visible, setVisible] = (0, import_react.useState)(12);
	const [query, setQuery] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		document.documentElement.lang = locale;
	}, [locale]);
	const scan = useQuery({
		queryKey: ["scan"],
		queryFn: () => runScan({ data: { force: false } }),
		staleTime: 45e3,
		refetchOnWindowFocus: false,
		retry: 1
	});
	const selected = research.venues;
	const opportunities = (0, import_react.useMemo)(() => {
		if (!scan.data || selected.length < 2) return [];
		return findResearchPairs(scan.data.legs, {
			...filters,
			query
		}, selected);
	}, [
		scan.data,
		filters,
		query,
		selected
	]);
	const overlap = scan.data == null || selected.length < 2 ? 0 : Object.values(scan.data.legs).filter((legs) => {
		return new Set(legs.filter((leg) => selected.includes(leg.exchange)).map((leg) => leg.exchange)).size >= 2;
	}).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, { compact: true }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex shrink-0 items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageSwitch, { compact: true }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuideLink, { compact: true }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm text-muted hover:bg-surface-2 hover:text-fg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: t("backToScan")
							})]
						})
					]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl font-medium tracking-tight text-fg",
						children: t("research")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-2xl text-pretty text-sm text-muted",
						children: t("researchLead")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-wide text-subtle uppercase",
						children: t("venues")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => research.reset(),
						className: "h-11 text-xs text-muted hover:text-fg",
						children: t("researchReset")
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: VENUES.map((venue) => {
						const on = selected.includes(venue.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": on,
							onClick: () => research.toggle(venue.id),
							className: cn("h-11 rounded-full px-3.5 text-sm shadow-border", on ? "bg-accent text-accent-fg" : "bg-surface text-muted hover:text-fg"),
							children: venue.label
						}, venue.id);
					})
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid grid-cols-2 gap-2 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: t("venues"),
							value: `${selected.length}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: t("researchOverlap"),
							value: scan.data && selected.length >= 2 ? String(overlap) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: t("statKept"),
							value: selected.length >= 2 ? String(opportunities.length) : "—"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: t("filterTicker"),
					className: "sm:max-w-xs"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-pretty text-xs text-muted",
					children: t("disclaimer", { notional: fmtUsd(filters.notional, locale) })
				}),
				scan.isPending && !scan.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-3",
					children: Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 w-full rounded-xl" }, i))
				}) : null,
				scan.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-xl bg-surface p-5 text-sm text-loss shadow-border",
					children: t("scanError")
				}) : null,
				scan.data && selected.length < 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-xl bg-surface px-5 py-10 text-center shadow-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-lg text-fg",
						children: t("researchNeedTwo")
					})
				}) : null,
				scan.data && selected.length >= 2 ? opportunities.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-surface px-5 py-10 text-center shadow-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-lg text-fg",
						children: t("emptyTitle")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-auto mt-2 max-w-md text-pretty text-sm text-muted",
						children: t("researchEmpty")
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpreadChart, { items: opportunities }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "flex flex-col gap-3",
						children: opportunities.slice(0, visible).map((opp, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpportunityCard, {
							rank: index + 1,
							opp,
							notional: filters.notional
						}) }, `${opp.symbol}-${opp.long.exchange}-${opp.short.exchange}`))
					}),
					opportunities.length > visible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "self-center",
						onClick: () => setVisible((n) => n + 20),
						children: t("showMore", { count: opportunities.length - visible })
					}) : null
				] }) : null
			]
		})]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-surface px-3 py-3 shadow-border sm:px-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-medium tracking-wide text-subtle uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-mono text-lg text-fg tabular-nums",
			children: value
		})]
	});
}
function Research() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResearchPage, {});
}
//#endregion
export { Research as component };
