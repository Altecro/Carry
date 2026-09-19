import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { i as Search } from "../_libs/lucide-react.mjs";
import { n as cn } from "./router-CWg1nYs3.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/language-switch-3fae6Zdy.js
var import_jsx_runtime = require_jsx_runtime();
var LOCALES = ["fr", "en"];
var LOCALE_LABEL = {
	fr: "FR",
	en: "EN"
};
var messages = {
	fr: {
		tagline: "find your funding",
		description: "Carry — find your funding. LONG un DEX, SHORT un autre. Lecture seule.",
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
		openVenue: "Ouvrir {venue}",
		perDay: "/ jour",
		long: "LONG",
		short: "SHORT",
		oi: "OI",
		oiMin: "OI min",
		vol: "vol",
		priceGapShort: "prix",
		costShort: "coût",
		breakevenShort: "seuil",
		na: "n/a",
		minutes: "min",
		accessCode: "code {code}",
		fundingInterval: "Paiement toutes les {hours}",
		longPrice: "Prix LONG",
		shortPrice: "Prix SHORT",
		longFees: "Frais LONG",
		shortFees: "Frais SHORT",
		cardDetail: "Pour {notional} par jambe, le carry brut est d’environ {daily} par jour tant que les taux tiennent. Lecture seule — aucun ordre n’est passé.",
		markets: "{count} marchés",
		hoursUnit: "h",
		copyBlurb: `{rank}. {symbol} : écart {spread} % APR (~{daily} $/jour pour {notional} par jambe)
   LONG  {longEx} ({longApr}){longIv}
   SHORT {shortEx} ({shortApr}){shortIv}
   OI/cap min {oi} | vol min {volume} | écart prix {priceGap} %
   Coût aller-retour ~{cost} % | remboursé en ~{hours} h si le taux tient`,
		billion: "Md$",
		million: "M$",
		thousand: "k$",
		dayShort: "j",
		guide: "Guide",
		research: "Recherche",
		researchLead: "Choisis au moins deux places. Carry ne croise que celles-ci et classe les tokens par écart APR.",
		researchNeedTwo: "Sélectionne au moins deux DEX pour lancer le croisement.",
		researchEmpty: "Aucun token commun liquide sur ces places avec les seuils actuels (OI, volume, écart de prix).",
		researchOverlap: "Tokens communs",
		researchReset: "Variational + Hyperliquid",
		backToScan: "Scanner"
	},
	en: {
		tagline: "find your funding",
		description: "Carry — find your funding. LONG one DEX, SHORT another. Read-only.",
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
		openVenue: "Open {venue}",
		perDay: "/ day",
		long: "LONG",
		short: "SHORT",
		oi: "OI",
		oiMin: "min OI",
		vol: "vol",
		priceGapShort: "gap",
		costShort: "cost",
		breakevenShort: "payback",
		na: "n/a",
		minutes: "min",
		accessCode: "code {code}",
		fundingInterval: "Paid every {hours}",
		longPrice: "LONG price",
		shortPrice: "SHORT price",
		longFees: "LONG fees",
		shortFees: "SHORT fees",
		cardDetail: "For {notional} per leg, gross carry is about {daily} per day while rates hold. Read-only — no orders are sent.",
		markets: "{count} markets",
		hoursUnit: "h",
		copyBlurb: `{rank}. {symbol}: spread {spread}% APR (~{daily} $/day for {notional} per leg)
   LONG  {longEx} ({longApr}){longIv}
   SHORT {shortEx} ({shortApr}){shortIv}
   min OI/cap {oi} | min vol {volume} | price gap {priceGap}%
   Round-trip cost ~{cost}% | paid back in ~{hours} h if the rate holds`,
		billion: "B$",
		million: "M$",
		thousand: "k$",
		dayShort: "d",
		guide: "Guide",
		research: "Research",
		researchLead: "Pick at least two venues. Carry crosses only those and ranks tokens by APR spread.",
		researchNeedTwo: "Select at least two DEXes to run the cross.",
		researchEmpty: "No liquid overlapping tokens on these venues with the current thresholds (OI, volume, price gap).",
		researchOverlap: "Shared tokens",
		researchReset: "Variational + Hyperliquid",
		backToScan: "Scanner"
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
function Logo({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className: cn("size-8 shrink-0", className),
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "32",
				height: "32",
				rx: "7",
				className: "fill-surface-2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "6",
				y: "8",
				width: "8",
				height: "16",
				rx: "1.5",
				className: "fill-accent"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "18",
				y: "14",
				width: "8",
				height: "10",
				rx: "1.5",
				className: "fill-muted"
			})
		]
	});
}
function Brand({ compact = false }) {
	const { t } = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/",
		"aria-label": "Carry",
		className: "flex min-w-0 shrink-0 items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { className: compact ? "size-7" : "size-8" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("block font-display font-medium tracking-tight text-fg", compact ? "text-lg" : "text-2xl"),
				children: "Carry"
			}), compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-0.5 block text-pretty text-sm text-muted",
				children: t("tagline")
			})]
		})]
	});
}
function ResearchLink({ compact = false }) {
	const { t } = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/research",
		"aria-label": t("research"),
		className: cn("inline-flex items-center justify-center rounded-md text-sm text-muted hover:bg-surface-2 hover:text-fg", compact ? "size-11 shrink-0 px-0" : "h-11 w-full px-3"),
		children: compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4" }) : t("research")
	});
}
function GuideLink({ compact = false }) {
	const { t } = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/docs",
		"aria-label": t("guide"),
		className: cn("inline-flex items-center justify-center rounded-md text-sm text-muted hover:bg-surface-2 hover:text-fg", compact ? "size-11 shrink-0 px-0" : "h-11 w-full px-3"),
		children: compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-xs tracking-wide",
			children: "?"
		}) : t("guide")
	});
}
function LanguageSwitch({ compact = false }) {
	const { t } = useT();
	const locale = useI18n((s) => s.locale);
	const setLocale = useI18n((s) => s.setLocale);
	const other = locale === "fr" ? "en" : "fr";
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => setLocale(other),
		"aria-label": t("language"),
		title: LOCALE_LABEL[other],
		className: "inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-2 text-xs font-medium text-fg",
		children: LOCALE_LABEL[locale]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "group",
		"aria-label": t("language"),
		className: "grid w-full grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1",
		children: LOCALES.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setLocale(id),
			className: cn("h-9 rounded-md text-xs font-medium transition-[background-color,color] duration-[var(--motion-quick)]", locale === id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"),
			children: LOCALE_LABEL[id]
		}, id))
	});
}
//#endregion
export { numberLocale as a, ResearchLink as i, GuideLink as n, t as o, LanguageSwitch as r, useT as s, Brand as t };
