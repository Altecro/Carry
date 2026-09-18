import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as Copy, c as ArrowDownRight, i as RefreshCw, o as Check, r as SlidersHorizontal, s as ArrowUpRight, t as X } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { a as DialogPortal, i as DialogOverlay, m as Slot, n as DialogClose, o as DialogTitle, r as DialogContent, s as DialogTrigger, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn } from "./router-DaRlC5bE.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { a as ResponsiveContainer, i as Bar, n as YAxis, o as Tooltip, r as XAxis, t as BarChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DyNLw9P6.js
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
	if (side === "long") return leg.aprLong ?? leg.apr;
	return leg.aprShort ?? leg.apr;
}
function breakevenHours(spreadApr, costPct) {
	const hourly = spreadApr / 8760;
	if (hourly <= 0) return Number.POSITIVE_INFINITY;
	return costPct / hourly;
}
function isLiquid(leg, filters) {
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
		const shortApr = sideApr(shortLeg, "short");
		const spread = shortApr - longApr;
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
				apr: longApr
			},
			short: {
				...shortLeg,
				apr: shortApr
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
	const disabled = new Set(filters.disabledVenues);
	const query = filters.query.trim().toUpperCase();
	const opportunities = [];
	for (const [symbol, legs] of Object.entries(legsBySymbol)) {
		if (query && !symbol.includes(query)) continue;
		const liquid = legs.filter((leg) => !disabled.has(leg.exchange) && isLiquid(leg, filters));
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
		label: "Orderly"
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
		id: "gtrade",
		label: "gTrade"
	},
	{
		id: "grvt",
		label: "GRVT"
	},
	{
		id: "qfex",
		label: "QFEX"
	},
	{
		id: "polymarket",
		label: "Polymarket"
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
var LOCALES = ["fr", "en"];
var LOCALE_LABEL = {
	fr: "FR",
	en: "EN"
};
var messages = {
	fr: {
		tagline: "Scanner d’arbitrage de funding entre DEX perp.",
		description: "Scanner d’arbitrage de funding : LONG sur un DEX, SHORT sur un autre. Lecture seule.",
		language: "Langue",
		refresh: "Actualiser",
		scanning: "Scan…",
		thresholds: "Seuils",
		close: "Fermer",
		presets: "Presets",
		presetLoose: "Souple",
		presetClassic: "Classique",
		presetTight: "Serré",
		presetUltra: "Ultra",
		applyPreset: "Valider le preset",
		ultraWarning: "Carnets < 50 k$ d’OI. Slippage, fills partiels, taux parfois fantômes. Taille mini.",
		minSpread: "Écart min",
		minOi: "Open interest min",
		minVolume: "Volume 24 h min",
		maxPriceGap: "Écart de prix max",
		maxBreakeven: "Remboursement max",
		notional: "Notionnel par jambe",
		venues: "Places",
		reset: "Réinitialiser",
		statVenues: "Places",
		statOverlap: "Tokens ≥ 2 DEX",
		statKept: "Retenus",
		lastScan: "Dernier scan",
		cache: "cache",
		filterTicker: "Filtrer un ticker…",
		disclaimer: "Lecture seule. Les API publiques des DEX sont croisées côté serveur — aucun ordre n’est envoyé. Gain estimé pour {notional} par jambe.",
		loadingBooks: "Lecture des carnets publics…",
		scanError: "Impossible de lire les marchés. Réessaie dans un instant.",
		showMore: "Voir les {count} autres",
		rescan: "Nouvelle lecture en cours…",
		emptyTitle: "Aucune opportunité",
		emptyHasMulti: "Change de preset ou baisse l’écart min. Souple = liquidité, Serré / Ultra = gros APR (carnets plus fins).",
		emptyNoMulti: "Aucun token en commun pour l’instant — une API a peut-être changé de format, ou le scan est encore incomplet.",
		topSpreads: "Top écarts",
		spread: "Écart",
		copy: "Copier",
		perDay: "/ jour",
		longPrice: "Prix LONG",
		shortPrice: "Prix SHORT",
		longFees: "Frais LONG",
		shortFees: "Frais SHORT",
		cardDetail: "Pour {notional} par jambe, le carry brut est d’environ {daily} par jour tant que les taux tiennent. Lecture seule — aucun ordre n’est passé.",
		markets: "{count} marchés",
		hoursUnit: "h",
		copyBlurb: `{rank}. {symbol} : écart {spread} % APR (~{daily} $/jour pour {notional} par jambe)
   LONG  {longEx} ({longApr})
   SHORT {shortEx} ({shortApr})
   OI/cap min {oi} | vol min {volume} | écart prix {priceGap} %
   Coût aller-retour ~{cost} % | remboursé en ~{hours} h si le taux tient`,
		billion: "Md$",
		million: "M$",
		thousand: "k$",
		dayShort: "j"
	},
	en: {
		tagline: "Funding-rate arb scanner across perp DEXes.",
		description: "Funding-rate arb scanner: LONG one DEX, SHORT another. Read-only.",
		language: "Language",
		refresh: "Refresh",
		scanning: "Scan…",
		thresholds: "Thresholds",
		close: "Close",
		presets: "Presets",
		presetLoose: "Loose",
		presetClassic: "Classic",
		presetTight: "Tight",
		presetUltra: "Ultra",
		applyPreset: "Apply preset",
		ultraWarning: "Books under $50k OI. Slippage, partial fills, sometimes ghost rates. Tiny size.",
		minSpread: "Min spread",
		minOi: "Min open interest",
		minVolume: "Min 24h volume",
		maxPriceGap: "Max price gap",
		maxBreakeven: "Max breakeven",
		notional: "Notional per leg",
		venues: "Venues",
		reset: "Reset",
		statVenues: "Venues",
		statOverlap: "Tokens on ≥2 DEXes",
		statKept: "Kept",
		lastScan: "Last scan",
		cache: "cache",
		filterTicker: "Filter a ticker…",
		disclaimer: "Read-only. Public DEX APIs are crossed on the server — no orders are sent. Estimated gain for {notional} per leg.",
		loadingBooks: "Reading public order books…",
		scanError: "Could not read markets. Try again in a moment.",
		showMore: "Show {count} more",
		rescan: "Refreshing markets…",
		emptyTitle: "No opportunities",
		emptyHasMulti: "Switch preset or lower the min spread. Loose = liquidity, Tight / Ultra = fat APRs (thinner books).",
		emptyNoMulti: "No overlapping tokens right now — an API may have changed, or the scan is still incomplete.",
		topSpreads: "Top spreads",
		spread: "Spread",
		copy: "Copy",
		perDay: "/ day",
		longPrice: "LONG price",
		shortPrice: "SHORT price",
		longFees: "LONG fees",
		shortFees: "SHORT fees",
		cardDetail: "For {notional} per leg, gross carry is about {daily} per day while rates hold. Read-only — no orders are sent.",
		markets: "{count} markets",
		hoursUnit: "h",
		copyBlurb: `{rank}. {symbol}: spread {spread}% APR (~{daily} $/day for {notional} per leg)
   LONG  {longEx} ({longApr})
   SHORT {shortEx} ({shortApr})
   min OI/cap {oi} | min vol {volume} | price gap {priceGap}%
   Round-trip cost ~{cost}% | paid back in ~{hours} h if the rate holds`,
		billion: "B$",
		million: "M$",
		thousand: "k$",
		dayShort: "d"
	}
};
var useI18n = create()(persist((set) => ({
	locale: "fr",
	setLocale: (locale) => set({ locale })
}), {
	name: "ecart-locale",
	partialize: (state) => ({ locale: state.locale })
}));
function t(locale, key, vars) {
	let text = messages[locale][key] ?? messages.fr[key];
	if (vars) for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
	return text;
}
function useT() {
	const locale = useI18n((s) => s.locale);
	return {
		locale,
		t: (key, vars) => t(locale, key, vars)
	};
}
function numberLocale(locale) {
	return locale === "fr" ? "fr-FR" : "en-US";
}
function nf(locale, digits, minDigits = 0) {
	return new Intl.NumberFormat(numberLocale(locale), {
		minimumFractionDigits: minDigits,
		maximumFractionDigits: digits
	});
}
function fmtUsd(amount, locale = "fr") {
	if (amount == null) return "n/a";
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
	if (hours < 1) return `${nf(locale, 0).format(hours * 60)} min`;
	if (hours < 48) return `${nf(locale, 0).format(hours)} h`;
	return `${nf(locale, 1).format(hours / 24)} ${t(locale, "dayShort")}`;
}
function fmtTime(ts, locale = "fr") {
	return new Intl.DateTimeFormat(numberLocale(locale), {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	}).format(ts);
}
function opportunityText(locale, rank, symbol, spread, longEx, longApr, shortEx, shortApr, oi, volume, priceGap, cost, hours, notional) {
	const daily = notional * spread / 100 / 365;
	return t(locale, "copyBlurb", {
		rank,
		symbol,
		spread: nf(locale, 1).format(spread),
		daily: nf(locale, 2, 2).format(daily),
		notional: fmtUsd(notional, locale),
		longEx,
		longApr: fmtApr(longApr, locale),
		shortEx,
		shortApr: fmtApr(shortApr, locale),
		oi: fmtUsd(oi, locale),
		volume: fmtUsd(volume, locale),
		priceGap: nf(locale, 2, 2).format(priceGap),
		cost: nf(locale, 2, 2).format(cost),
		hours: nf(locale, 0).format(hours)
	});
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
var Sheet = Dialog;
var SheetTrigger = DialogTrigger;
var SheetPortal = DialogPortal;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {
	className: cn("fixed inset-0 z-50 bg-bg/70 data-[state=open]:animate-in data-[state=closed]:animate-out", className),
	...props,
	ref
}));
SheetOverlay.displayName = DialogOverlay.displayName;
var SheetContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
	ref,
	className: cn("fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-2xl bg-surface p-5 shadow-border outline-none", className),
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong" }),
		children,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
			className: "absolute top-4 right-4 rounded-md p-2 text-muted hover:text-fg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetCloseLabel, {})]
		})
	]
})] }));
SheetContent.displayName = DialogContent.displayName;
function SheetCloseLabel() {
	const { t } = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "sr-only",
		children: t("close")
	});
}
function SheetHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("mb-4 pr-8", className),
		...props
	});
}
function SheetTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
		className: cn("font-display text-lg font-medium text-fg", className),
		...props
	});
}
var Slider = import_react.forwardRef(({ className, min, max, step, value, onValueChange }, ref) => {
	const current = value[0] ?? min;
	const pct = max === min ? 0 : (current - min) / (max - min) * 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		ref,
		type: "range",
		min,
		max,
		step,
		value: current,
		suppressHydrationWarning: true,
		onChange: (event) => onValueChange([Number(event.target.value)]),
		style: { ["--slider-pct"]: `${pct}%` },
		className: cn("slider-range", className)
	});
});
Slider.displayName = "Slider";
function Field({ label, value, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-medium tracking-wide text-muted uppercase",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-sm text-fg tabular-nums",
				children: value
			})]
		}), children]
	});
}
function activePreset(filters) {
	return Object.keys(FILTER_PRESETS).find((key) => {
		const preset = FILTER_PRESETS[key];
		return preset.minSpreadApr === filters.minSpreadApr && preset.minOpenInterest === filters.minOpenInterest && preset.minVolume24h === filters.minVolume24h && preset.maxPriceGapPct === filters.maxPriceGapPct && preset.maxBreakevenHours === filters.maxBreakevenHours;
	}) ?? null;
}
function FilterPanel({ filters, onChange, onReset, venueErrors }) {
	const { locale, t } = useT();
	const applied = activePreset(filters);
	const [pending, setPending] = (0, import_react.useState)(null);
	const selected = pending ?? applied;
	const canApply = pending != null;
	const presetLabels = {
		souple: t("presetLoose"),
		classic: t("presetClassic"),
		strict: t("presetTight"),
		ultra: t("presetUltra")
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-xs font-medium tracking-wide text-muted uppercase",
					children: t("presets")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1",
					children: Object.keys(FILTER_PRESETS).map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setPending(key),
						className: cn("h-9 rounded-md text-xs font-medium transition-[background-color,color] duration-[var(--motion-quick)]", selected === key ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"),
						children: presetLabels[key]
					}, key))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-2 w-full",
					variant: canApply ? "default" : "outline",
					disabled: !canApply,
					onClick: () => {
						if (!pending) return;
						onChange(FILTER_PRESETS[pending]);
						setPending(null);
					},
					children: t("applyPreset")
				}),
				selected === "ultra" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-pretty text-xs leading-relaxed text-loss",
					children: t("ultraWarning")
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: t("minSpread"),
				value: `${filters.minSpreadApr} % APR`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: 0,
					max: 80,
					step: 1,
					value: [filters.minSpreadApr],
					onValueChange: ([v]) => onChange({ minSpreadApr: v ?? 0 })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: t("minOi"),
				value: fmtUsd(filters.minOpenInterest, locale),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: 0,
					max: 2e6,
					step: 25e3,
					value: [filters.minOpenInterest],
					onValueChange: ([v]) => onChange({ minOpenInterest: v ?? 0 })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: t("minVolume"),
				value: fmtUsd(filters.minVolume24h, locale),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: 0,
					max: 2e6,
					step: 25e3,
					value: [filters.minVolume24h],
					onValueChange: ([v]) => onChange({ minVolume24h: v ?? 0 })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: t("maxPriceGap"),
				value: `${filters.maxPriceGapPct} %`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: .1,
					max: 5,
					step: .1,
					value: [filters.maxPriceGapPct],
					onValueChange: ([v]) => onChange({ maxPriceGapPct: v ?? .1 })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: t("maxBreakeven"),
				value: `${filters.maxBreakevenHours} ${t("hoursUnit")}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: 6,
					max: 168,
					step: 6,
					value: [filters.maxBreakevenHours],
					onValueChange: ([v]) => onChange({ maxBreakevenHours: v ?? 6 })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: t("notional"),
				value: fmtUsd(filters.notional, locale),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: 100,
					max: 1e4,
					step: 100,
					value: [filters.notional],
					onValueChange: ([v]) => onChange({ notional: v ?? 100 })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-xs font-medium tracking-wide text-muted uppercase",
				children: t("venues")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1.5",
				children: VENUES.map((venue) => {
					const off = filters.disabledVenues.includes(venue.id);
					const err = venueErrors[venue.id];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						title: err ?? venue.label,
						onClick: () => {
							onChange({ disabledVenues: off ? filters.disabledVenues.filter((id) => id !== venue.id) : [...filters.disabledVenues, venue.id] });
						},
						className: cn("h-8 rounded-full px-2.5 text-xs font-medium shadow-border transition-[background-color,color,opacity] duration-[var(--motion-quick)]", off ? "text-subtle opacity-50" : err ? "text-loss" : "bg-surface-2 text-fg"),
						children: venue.label
					}, venue.id);
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "sm",
				onClick: onReset,
				className: "self-start",
				children: t("reset")
			})
		]
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
	async function copy() {
		const text = opportunityText(locale, rank, opp.symbol, opp.spread, venueName(opp.long.exchange), opp.long.apr, venueName(opp.short.exchange), opp.short.apr, Math.min(opp.long.oi, opp.short.oi), volMin, opp.priceGap, opp.cost, opp.hours, notional);
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
					exchange: venueName(opp.long.exchange),
					apr: opp.long.apr
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegRow, {
					side: "short",
					exchange: venueName(opp.short.exchange),
					apr: opp.short.apr
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted tabular-nums",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "inline text-subtle",
						children: "OI "
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "inline",
						children: fmtUsd(Math.min(opp.long.oi, opp.short.oi), locale)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "inline text-subtle",
						children: "vol "
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "inline",
						children: fmtUsd(volMin, locale)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "inline text-subtle",
						children: "prix "
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "inline",
						children: fmtPct(opp.priceGap, locale)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "inline text-subtle",
						children: "coût "
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "inline",
						children: fmtPct(opp.cost, locale)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "inline text-subtle",
						children: "seuil "
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
								children: opp.long.skipPrice ? "n/a" : opp.long.price.toLocaleString(numberLocale(locale))
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
								children: opp.short.skipPrice ? "n/a" : opp.short.price.toLocaleString(numberLocale(locale))
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
function LegRow({ side, exchange, apr }) {
	const { locale } = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-w-0 items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(side === "long" ? ArrowUpRight : ArrowDownRight, { className: "size-3.5 shrink-0 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-wider text-subtle uppercase",
					children: side
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-sm text-fg",
					children: exchange
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: cn("font-mono text-sm tabular-nums", apr >= 0 ? "text-gain" : "text-loss"),
			children: fmtApr(apr, locale)
		})]
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
			className: "h-40 sm:h-44",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: "100%",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
					data,
					layout: "vertical",
					margin: {
						left: 8,
						right: 16,
						top: 0,
						bottom: 0
					},
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
							width: 56,
							tick: {
								fill: "var(--color-fg)",
								fontSize: 11
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
function LanguageSwitch({ compact = false }) {
	const { t } = useT();
	const locale = useI18n((s) => s.locale);
	const setLocale = useI18n((s) => s.setLocale);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "group",
		"aria-label": t("language"),
		className: cn("grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1", compact ? "w-24" : "w-full"),
		children: LOCALES.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setLocale(id),
			className: cn("h-9 rounded-md text-xs font-medium transition-[background-color,color] duration-[var(--motion-quick)]", locale === id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"),
			children: LOCALE_LABEL[id]
		}, id))
	});
}
function Desk() {
	const queryClient = useQueryClient();
	const filters = useFilters();
	const { locale, t } = useT();
	const [elapsed, setElapsed] = (0, import_react.useState)(0);
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
	const refresh = useMutation({
		mutationFn: () => runScan({ data: { force: true } }),
		onSuccess: (data) => {
			queryClient.setQueryData(["scan"], data);
		}
	});
	const loading = scan.isPending || refresh.isPending;
	const [visible, setVisible] = (0, import_react.useState)(12);
	const onRefresh = () => {
		setElapsed(0);
		const t0 = Date.now();
		const timer = window.setInterval(() => setElapsed(Date.now() - t0), 200);
		refresh.mutate(void 0, { onSettled: () => window.clearInterval(timer) });
	};
	const opportunities = (0, import_react.useMemo)(() => {
		if (!scan.data) return [];
		return findOpportunities(scan.data.legs, filters);
	}, [scan.data, filters]);
	const venueErrors = (0, import_react.useMemo)(() => {
		const map = {};
		for (const venue of scan.data?.venues ?? []) if (venue.error) map[venue.id] = venue.error;
		return map;
	}, [scan.data]);
	const multi = scan.data == null ? 0 : Object.values(scan.data.legs).filter((legs) => legs.length >= 2).length;
	const venueOk = scan.data?.venues.filter((v) => !v.error).length ?? 0;
	const venueTotal = scan.data?.venues.length ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "desk-shell mx-auto flex max-w-7xl flex-col",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "hidden border-r border-border lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-6 pt-8 pb-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 px-6 pb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageSwitch, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshButton, {
							loading,
							elapsed,
							onRefresh
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 px-6 pb-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterPanel, {
							filters,
							onChange: filters.set,
							onReset: filters.reset,
							venueErrors
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "sticky top-0 z-30 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm lg:hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-w-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, { compact: true })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageSwitch, { compact: true }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										size: "icon",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "sr-only",
											children: t("thresholds")
										})]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: t("thresholds") }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "overflow-y-auto pb-8",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterPanel, {
										filters,
										onChange: filters.set,
										onReset: filters.reset,
										venueErrors
									})
								})] })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshButton, {
									loading,
									elapsed,
									onRefresh
								})
							]
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "flex flex-col gap-6 px-4 py-6 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: t("statVenues"),
									value: scan.data ? `${venueOk}/${venueTotal}` : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: t("statOverlap"),
									value: scan.data ? String(multi) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: t("statKept"),
									value: scan.data ? String(opportunities.length) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: t("lastScan"),
									value: scan.data ? `${fmtTime(scan.data.scannedAt, locale)}${scan.data.cached ? ` · ${t("cache")}` : ""}` : "—"
								})
							]
						}),
						scan.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VenueStrip, { venues: scan.data.venues }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-9 w-full rounded-full" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 sm:flex-row sm:items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: filters.query,
								onChange: (e) => filters.set({ query: e.target.value }),
								placeholder: t("filterTicker"),
								className: "sm:max-w-xs"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-pretty text-xs text-muted",
								children: t("disclaimer", { notional: fmtUsd(filters.notional, locale) })
							})]
						}),
						filters.minOpenInterest === FILTER_PRESETS.ultra.minOpenInterest && filters.minSpreadApr === FILTER_PRESETS.ultra.minSpreadApr ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-xl bg-surface px-4 py-3 text-pretty text-sm text-loss shadow-border",
							children: t("ultraWarning")
						}) : null,
						loading && !scan.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingState, {}) : null,
						scan.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-xl bg-surface p-5 text-sm text-loss shadow-border",
							children: t("scanError")
						}) : null,
						scan.data && !loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpreadChart, { items: opportunities }), opportunities.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { hasMulti: multi > 0 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "flex flex-col gap-3",
							children: opportunities.slice(0, visible).map((opp, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpportunityCard, {
								rank: index + 1,
								opp,
								notional: filters.notional
							}) }, `${opp.symbol}-${opp.long.exchange}-${opp.short.exchange}`))
						}), opportunities.length > visible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "self-center",
							onClick: () => setVisible((n) => n + 20),
							children: t("showMore", { count: opportunities.length - visible })
						}) : null] })] }) : null,
						loading && scan.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-xs text-muted",
							children: t("rescan")
						}) : null
					]
				})]
			})]
		})
	});
}
function RefreshButton({ loading, elapsed, onRefresh }) {
	const { t } = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		onClick: onRefresh,
		disabled: loading,
		className: "min-w-32 lg:w-full",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: cn("size-4", loading && "animate-spin") }), loading ? elapsed ? `${(elapsed / 1e3).toFixed(0)} s` : t("scanning") : t("refresh")]
	});
}
function Brand({ compact = false }) {
	const { t } = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-2xl font-medium tracking-tight text-fg",
			children: "Écart"
		}), compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-pretty text-sm text-muted",
			children: t("tagline")
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
function VenueStrip({ venues }) {
	const { t } = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-nowrap gap-2 overflow-x-auto pb-1",
		children: venues.map((venue) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			title: venue.error ?? t("markets", { count: venue.count }),
			className: cn("shrink-0 rounded-full px-2.5 py-1 font-mono text-xs tabular-nums shadow-border", venue.error ? "text-loss" : "text-muted"),
			children: [
				venue.label,
				" ",
				venue.error ? "—" : venue.count
			]
		}, venue.id))
	});
}
function LoadingState() {
	const { t } = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: t("loadingBooks")
		}), Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 w-full rounded-xl" }, i))]
	});
}
function EmptyState({ hasMulti }) {
	const { t } = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-surface px-5 py-10 text-center shadow-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-lg text-fg",
			children: t("emptyTitle")
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mx-auto mt-2 max-w-md text-pretty text-sm text-muted",
			children: hasMulti ? t("emptyHasMulti") : t("emptyNoMulti")
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, {});
}
//#endregion
export { Home as component };
