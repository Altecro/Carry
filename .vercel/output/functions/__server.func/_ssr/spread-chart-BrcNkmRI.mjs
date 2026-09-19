import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { c as ArrowUpRight, o as Copy, s as Check, u as ArrowDownRight } from "../_libs/lucide-react.mjs";
import { m as Slot } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn } from "./router-CWg1nYs3.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { a as numberLocale, o as t, s as useT } from "./language-switch-3fae6Zdy.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as ResponsiveContainer, i as Bar, n as YAxis, o as Tooltip, r as XAxis, t as BarChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/spread-chart-BrcNkmRI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var runScan = createServerFn({ method: "POST" }).validator((data) => {
	return { force: Boolean((data && typeof data === "object" ? data : {}).force) };
}).handler(createSsrRpc("ba0addaea20e0d22d67637393a8ed148f84a4056172add5aded1fa69b1b23c1f"));
function sideApr(leg, side) {
	if (side === "long") {
		const value = leg.aprLong ?? leg.apr;
		return leg.pnlBySide ? -value : value;
	}
	return leg.aprShort ?? leg.apr;
}
function displayApr(leg, side) {
	const value = side === "long" ? leg.aprLong ?? leg.apr : leg.aprShort ?? leg.apr;
	if (side === "long") return leg.pnlBySide ? value : -value;
	return value;
}
function breakevenHours(spreadApr, costPct) {
	const hourly = spreadApr / 8760;
	if (hourly <= 0) return Number.POSITIVE_INFINITY;
	return costPct / hourly;
}
function isLiquid(leg, filters) {
	if (leg.oiIsCap) return leg.oi != null && filters.notional <= leg.oi;
	if (leg.oi == null) return leg.volume != null && leg.volume >= filters.minVolume24h;
	if (leg.oi < filters.minOpenInterest) return false;
	if (leg.volume == null) return true;
	return leg.volume >= filters.minVolume24h;
}
function bestPair(symbol, legs, filters) {
	let best = null;
	for (let i = 0; i < legs.length; i++) for (let j = 0; j < legs.length; j++) {
		if (i === j) continue;
		const longLeg = legs[i];
		const shortLeg = legs[j];
		const longApr = sideApr(longLeg, "long");
		const spread = sideApr(shortLeg, "short") - longApr;
		if (spread < filters.minSpreadApr || best && spread <= best.spread) continue;
		let priceGap = 0;
		if (!longLeg.skipPrice && !shortLeg.skipPrice) {
			const lower = Math.min(longLeg.price, shortLeg.price);
			if (lower <= 0) continue;
			priceGap = Math.abs(longLeg.price - shortLeg.price) / lower * 100;
		}
		if (priceGap > filters.maxPriceGapPct) continue;
		const cost = longLeg.costPct + shortLeg.costPct;
		const hours = breakevenHours(spread, cost);
		if (hours > filters.maxBreakevenHours) continue;
		best = {
			symbol,
			long: {
				...longLeg,
				apr: displayApr(longLeg, "long")
			},
			short: {
				...shortLeg,
				apr: displayApr(shortLeg, "short")
			},
			spread,
			priceGap,
			cost,
			hours
		};
	}
	return best;
}
function findOpportunities(legsBySymbol, filters) {
	return collectOpportunities(legsBySymbol, filters, null);
}
/** Paires parmi un ensemble de places, classées par écart (recherche). */
function findResearchPairs(legsBySymbol, filters, venueIds) {
	if (venueIds.length < 2) return [];
	return collectOpportunities(legsBySymbol, {
		...filters,
		minSpreadApr: 0,
		disabledVenues: []
	}, new Set(venueIds));
}
function collectOpportunities(legsBySymbol, filters, allow) {
	const disabled = new Set(filters.disabledVenues);
	const query = filters.query.trim().toUpperCase();
	const opportunities = [];
	for (const [symbol, legs] of Object.entries(legsBySymbol)) {
		if (query && !symbol.includes(query)) continue;
		const liquid = legs.filter((leg) => {
			if (allow) {
				if (!allow.has(leg.exchange)) return false;
			} else if (disabled.has(leg.exchange)) return false;
			return isLiquid(leg, filters);
		});
		if (liquid.length < 2) continue;
		const opportunity = bestPair(symbol, liquid, filters);
		if (opportunity) opportunities.push(opportunity);
	}
	opportunities.sort((a, b) => b.spread - a.spread);
	return opportunities;
}
function dailyGain(spreadApr, notional) {
	return notional * spreadApr / 100 / 365;
}
var VENUES = [
	{
		id: "variational",
		label: "Variational"
	},
	{
		id: "hyperliquid",
		label: "Hyperliquid"
	},
	{
		id: "carbon",
		label: "Carbon"
	},
	{
		id: "extended",
		label: "Extended"
	},
	{
		id: "lighter",
		label: "Lighter"
	},
	{
		id: "paradex",
		label: "Paradex"
	},
	{
		id: "orderly",
		label: "WOOFi"
	},
	{
		id: "backpack",
		label: "Backpack"
	},
	{
		id: "aster",
		label: "Aster"
	},
	{
		id: "pacifica",
		label: "Pacifica"
	},
	{
		id: "hibachi",
		label: "Hibachi"
	},
	{
		id: "carbon_tradfi",
		label: "Carbon TradFi"
	},
	{
		id: "grvt",
		label: "GRVT"
	},
	{
		id: "polymarket",
		label: "Polymarket"
	},
	{
		id: "arcus",
		label: "Arcus"
	},
	{
		id: "popdex",
		label: "PopDEX"
	}
];
var VENUE_LABEL = Object.fromEntries(VENUES.map((v) => [v.id, v.label]));
var DEFAULT_FILTERS = {
	minSpreadApr: 20,
	minOpenInterest: 3e5,
	minVolume24h: 2e5,
	maxPriceGapPct: 1,
	maxBreakevenHours: 72,
	notional: 1e3,
	disabledVenues: [],
	query: ""
};
var FILTER_PRESETS = {
	souple: {
		minSpreadApr: 8,
		minOpenInterest: 5e5,
		minVolume24h: 3e5,
		maxPriceGapPct: 2,
		maxBreakevenHours: 120
	},
	classic: {
		minSpreadApr: 20,
		minOpenInterest: 3e5,
		minVolume24h: 2e5,
		maxPriceGapPct: 1,
		maxBreakevenHours: 72
	},
	strict: {
		minSpreadApr: 45,
		minOpenInterest: 1e5,
		minVolume24h: 5e4,
		maxPriceGapPct: .8,
		maxBreakevenHours: 48
	},
	ultra: {
		minSpreadApr: 50,
		minOpenInterest: 25e3,
		minVolume24h: 25e3,
		maxPriceGapPct: 1.2,
		maxBreakevenHours: 36
	}
};
var useFilters = create()(persist((set) => ({
	...DEFAULT_FILTERS,
	set: (patch) => set(patch),
	reset: () => set({
		...DEFAULT_FILTERS,
		query: ""
	})
}), {
	name: "ecart-filters",
	partialize: (state) => ({
		minSpreadApr: state.minSpreadApr,
		minOpenInterest: state.minOpenInterest,
		minVolume24h: state.minVolume24h,
		maxPriceGapPct: state.maxPriceGapPct,
		maxBreakevenHours: state.maxBreakevenHours,
		notional: state.notional,
		disabledVenues: state.disabledVenues
	})
}));
var DEFAULT_RESEARCH_VENUES = ["variational", "hyperliquid"];
var useResearch = create()(persist((set, get) => ({
	venues: DEFAULT_RESEARCH_VENUES,
	toggle: (id) => {
		const current = get().venues;
		set({ venues: current.includes(id) ? current.filter((item) => item !== id) : [...current, id] });
	},
	reset: () => set({ venues: DEFAULT_RESEARCH_VENUES })
}), {
	name: "carry-research",
	partialize: (state) => ({ venues: state.venues })
}));
var VENUE_URL = {
	variational: "https://omni.variational.io/markets?ref=OMNI35WM137P",
	hyperliquid: "https://app.hyperliquid.xyz/join/AMYUKI",
	carbon: "https://app.carbon.inc/ref/Amyuki",
	carbon_tradfi: "https://app.carbon.inc/ref/Amyuki",
	extended: "https://app.extended.exchange",
	lighter: "https://app.lighter.xyz/?referral=AMYUKI&source=none",
	paradex: "https://app.paradex.trade/r/Amyuki",
	orderly: "https://pro.woofi.com?ref=AMYUKI",
	backpack: "https://backpack.exchange",
	aster: "https://www.asterdex.com/en/referral/4B2068",
	pacifica: "https://app.pacifica.fi",
	hibachi: "https://hibachi.xyz/r/amyuki",
	gtrade: "https://gains.trade",
	grvt: "https://grvt.io",
	qfex: "https://www.qfex.com",
	polymarket: "https://polymarket.com",
	arcus: "https://waitlist.arcus.xyz/s/AMYUKI",
	popdex: "https://app.popdex.xyz"
};
var VENUE_ACCESS_CODE = {
	variational: "OMNI35WM137P",
	carbon: "Amyuki",
	carbon_tradfi: "Amyuki",
	lighter: "AMYUKI",
	paradex: "Amyuki",
	orderly: "AMYUKI",
	aster: "4B2068",
	hibachi: "amyuki",
	arcus: "AMYUKI"
};
function venueUrl(id) {
	return VENUE_URL[id];
}
function venueAccessCode(id) {
	return VENUE_ACCESS_CODE[id];
}
function nf(locale, digits, minDigits = 0) {
	return new Intl.NumberFormat(numberLocale(locale), {
		minimumFractionDigits: minDigits,
		maximumFractionDigits: digits
	});
}
function fmtUsd(amount, locale = "fr") {
	if (amount == null) return t(locale, "na");
	if (amount >= 1e9) return `${nf(locale, 1).format(amount / 1e9)} ${t(locale, "billion")}`;
	if (amount >= 1e6) return `${nf(locale, 1).format(amount / 1e6)} ${t(locale, "million")}`;
	if (amount >= 1e3) return `${nf(locale, 0).format(amount / 1e3)} ${t(locale, "thousand")}`;
	return `${nf(locale, 0).format(amount)} $`;
}
function fmtApr(value, locale = "fr") {
	return `${value > 0 ? "+" : ""}${nf(locale, 1).format(value)} %`;
}
function fmtPct(value, locale = "fr", digits = 2) {
	return `${nf(locale, digits, digits === 2 ? 2 : 0).format(value)} %`;
}
function fmtHours(hours, locale = "fr") {
	if (!Number.isFinite(hours)) return "∞";
	if (hours < 1) return `${nf(locale, 0).format(hours * 60)} ${t(locale, "minutes")}`;
	if (hours < 48) return `${nf(locale, 0).format(hours)} ${t(locale, "hoursUnit")}`;
	return `${nf(locale, 1).format(hours / 24)} ${t(locale, "dayShort")}`;
}
function fmtFundingHours(hours, locale = "fr") {
	if (hours == null || hours <= 0 || !Number.isFinite(hours)) return null;
	if (hours < 1) return `${nf(locale, 0).format(hours * 60)} ${t(locale, "minutes")}`;
	return `${nf(locale, hours % 1 === 0 ? 0 : 1).format(hours)} ${t(locale, "hoursUnit")}`;
}
function fmtTime(ts, locale = "fr") {
	return new Intl.DateTimeFormat(numberLocale(locale), {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	}).format(ts);
}
function opportunityText(locale, rank, symbol, spread, longEx, longApr, shortEx, shortApr, oi, volume, priceGap, cost, hours, notional, longId, shortId, longFundingHours, shortFundingHours) {
	const daily = notional * spread / 100 / 365;
	const iv = (hours) => {
		const label = fmtFundingHours(hours, locale);
		return label ? ` · ${label}` : "";
	};
	const body = t(locale, "copyBlurb", {
		rank,
		symbol,
		spread: nf(locale, 1).format(spread),
		daily: nf(locale, 2, 2).format(daily),
		notional: fmtUsd(notional, locale),
		longEx,
		longApr: fmtApr(longApr, locale),
		shortEx,
		shortApr: fmtApr(shortApr, locale),
		longIv: iv(longFundingHours),
		shortIv: iv(shortFundingHours),
		oi: fmtUsd(oi, locale),
		volume: fmtUsd(volume, locale),
		priceGap: nf(locale, 2, 2).format(priceGap),
		cost: nf(locale, 2, 2).format(cost),
		hours: nf(locale, 0).format(hours)
	});
	const longHref = longId ? venueUrl(longId) : void 0;
	const shortHref = shortId ? venueUrl(shortId) : void 0;
	if (!longHref && !shortHref) return body;
	const line = (name, id, href) => {
		if (!href || !id) return null;
		const code = venueAccessCode(id);
		return code ? `   ${name} ${href}  (${t(locale, "accessCode", { code })})` : `   ${name} ${href}`;
	};
	return [
		body,
		line(longEx, longId, longHref),
		line(shortEx, shortId, shortHref)
	].filter(Boolean).join("\n");
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,color,box-shadow,transform,opacity] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg shadow-border hover:opacity-90",
			outline: "bg-transparent text-fg shadow-border hover:bg-surface-2",
			ghost: "text-muted hover:bg-surface-2 hover:text-fg",
			subtle: "bg-surface-2 text-fg hover:bg-surface-3"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
	type,
	suppressHydrationWarning: true,
	className: cn("flex h-11 w-full rounded-md bg-surface-2 px-3 text-sm text-fg shadow-border outline-none transition-[box-shadow] duration-[var(--motion-quick)] placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className),
	ref,
	...props
}));
Input.displayName = "Input";
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse rounded-md bg-surface-3", className),
		...props
	});
}
function venueName(id) {
	return VENUE_LABEL[id] ?? id;
}
function OpportunityCard({ rank, opp, notional }) {
	const { locale, t } = useT();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const daily = dailyGain(opp.spread, notional);
	const volumes = [opp.long.volume, opp.short.volume].filter((v) => v != null);
	const volMin = volumes.length ? Math.min(...volumes) : null;
	const oiValues = [opp.long, opp.short].filter((leg) => !leg.oiIsCap && leg.oi != null).map((leg) => leg.oi);
	const oiMin = oiValues.length ? Math.min(...oiValues) : null;
	async function copy() {
		const text = opportunityText(locale, rank, opp.symbol, opp.spread, venueName(opp.long.exchange), opp.long.apr, venueName(opp.short.exchange), opp.short.apr, oiMin, volMin, opp.priceGap, opp.cost, opp.hours, notional, opp.long.exchange, opp.short.exchange, opp.long.fundingHours, opp.short.fundingHours);
		await navigator.clipboard.writeText(text);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1400);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: cn("opp-enter rounded-xl bg-surface p-4 shadow-border sm:p-5", "transition-[box-shadow] duration-[var(--motion-quick)] hover:shadow-border-hover"),
		style: { animationDelay: `${Math.min(rank - 1, 8) * 40}ms` },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setOpen((v) => !v),
					className: "flex min-w-0 flex-1 items-baseline gap-3 text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs text-subtle tabular-nums",
						children: String(rank).padStart(2, "0")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate font-display text-xl font-medium tracking-tight text-fg sm:text-2xl",
						children: opp.symbol
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xl font-medium text-gain tabular-nums sm:text-2xl",
							children: fmtApr(opp.spread, locale)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								"~",
								fmtUsd(daily, locale),
								" ",
								t("perDay")
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: copy,
						className: "relative size-11 text-muted hover:text-fg",
						"aria-label": t("copy"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("absolute inset-0 flex items-center justify-center transition-[opacity,transform,filter] duration-[var(--motion-fast)]", copied ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-[4px]"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("flex items-center justify-center transition-[opacity,transform,filter] duration-[var(--motion-fast)]", copied ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegRow, {
					side: "long",
					exchangeId: opp.long.exchange,
					exchange: venueName(opp.long.exchange),
					apr: opp.long.apr,
					oi: opp.long.oi,
					oiIsCap: opp.long.oiIsCap,
					fundingHours: opp.long.fundingHours
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegRow, {
					side: "short",
					exchangeId: opp.short.exchange,
					exchange: venueName(opp.short.exchange),
					apr: opp.short.apr,
					oi: opp.short.oi,
					oiIsCap: opp.short.oiIsCap,
					fundingHours: opp.short.fundingHours
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted tabular-nums",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
						className: "inline text-subtle",
						children: [t("oiMin"), " "]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "inline",
						children: fmtUsd(oiMin, locale)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
						className: "inline text-subtle",
						children: [t("vol"), " "]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "inline",
						children: fmtUsd(volMin, locale)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
						className: "inline text-subtle",
						children: [t("priceGapShort"), " "]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "inline",
						children: fmtPct(opp.priceGap, locale)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
						className: "inline text-subtle",
						children: [t("costShort"), " "]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "inline",
						children: fmtPct(opp.cost, locale)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
						className: "inline text-subtle",
						children: [t("breakevenShort"), " "]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "inline",
						children: fmtHours(opp.hours, locale)
					})] })
				]
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3 rounded-lg bg-surface-2 p-3 text-sm sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-muted",
						children: [
							t("longPrice"),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-fg tabular-nums",
								children: opp.long.skipPrice ? t("na") : opp.long.price.toLocaleString(numberLocale(locale))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-muted",
						children: [
							t("shortPrice"),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-fg tabular-nums",
								children: opp.short.skipPrice ? t("na") : opp.short.price.toLocaleString(numberLocale(locale))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-muted",
						children: [
							t("longFees"),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-fg tabular-nums",
								children: fmtPct(opp.long.costPct, locale)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-muted",
						children: [
							t("shortFees"),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-fg tabular-nums",
								children: fmtPct(opp.short.costPct, locale)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-pretty text-muted sm:col-span-2",
						children: t("cardDetail", {
							notional: fmtUsd(notional, locale),
							daily: fmtUsd(daily, locale)
						})
					})
				]
			}) : null
		]
	});
}
function LegRow({ side, exchangeId, exchange, apr, oi, oiIsCap, fundingHours }) {
	const { locale, t } = useT();
	const href = venueUrl(exchangeId);
	const code = venueAccessCode(exchangeId);
	const interval = fmtFundingHours(fundingHours, locale);
	const body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(side === "long" ? ArrowUpRight : ArrowDownRight, { className: "size-3.5 shrink-0 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-wider text-subtle uppercase",
					children: t(side === "long" ? "long" : "short")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-sm text-fg underline-offset-2 group-hover:underline",
					children: exchange
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-xs text-muted tabular-nums",
					children: [oi == null ? `${t("oi")} n/d` : `${oiIsCap ? "max" : t("oi")} ${fmtUsd(oi, locale)}`, interval ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" · ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						title: t("fundingInterval", { hours: interval }),
						children: interval
					})] }) : null]
				})
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: cn("font-mono text-sm tabular-nums", apr >= 0 ? "text-gain" : "text-loss"),
		children: fmtApr(apr, locale)
	})] });
	const box = "flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2.5";
	if (!href) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: box,
		children: body
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href,
		target: "_blank",
		rel: "noopener noreferrer",
		"aria-label": t("openVenue", { venue: exchange }),
		title: code ? `${exchange} · ${code}` : exchange,
		className: cn(box, "group"),
		children: body
	});
}
function SpreadChart({ items }) {
	const { t } = useT();
	const data = items.slice(0, 8).map((opp) => ({
		symbol: opp.symbol,
		spread: Number(opp.spread.toFixed(1))
	}));
	if (data.length < 2) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-surface p-3 shadow-border sm:p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 text-xs font-medium tracking-wide text-muted uppercase",
			children: t("topSpreads")
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-52 sm:h-56",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: "100%",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
					data,
					layout: "vertical",
					margin: {
						left: 4,
						right: 16,
						top: 4,
						bottom: 4
					},
					barCategoryGap: 6,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							type: "number",
							tick: {
								fill: "var(--color-muted)",
								fontSize: 11
							},
							axisLine: false,
							tickLine: false,
							unit: "%"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
							type: "category",
							dataKey: "symbol",
							width: 58,
							interval: 0,
							minTickGap: 0,
							tick: {
								fill: "var(--color-fg)",
								fontSize: 11,
								fontFamily: "var(--font-mono)"
							},
							axisLine: false,
							tickLine: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
							cursor: { fill: "color-mix(in oklab, var(--color-fg) 6%, transparent)" },
							contentStyle: {
								background: "var(--color-surface-2)",
								border: "1px solid color-mix(in oklab, var(--color-fg) 12%, transparent)",
								borderRadius: 8,
								color: "var(--color-fg)",
								fontSize: 12
							},
							formatter: (value) => [`${value} % APR`, t("spread")]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							dataKey: "spread",
							fill: "var(--color-gain)",
							radius: [
								0,
								4,
								4,
								0
							],
							barSize: 12
						})
					]
				})
			})
		})]
	});
}
//#endregion
export { Skeleton as a, findOpportunities as c, fmtUsd as d, runScan as f, venueUrl as h, OpportunityCard as i, findResearchPairs as l, useResearch as m, FILTER_PRESETS as n, SpreadChart as o, useFilters as p, Input as r, VENUES as s, Button as t, fmtTime as u };
