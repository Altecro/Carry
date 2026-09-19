import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as RefreshCw, r as SlidersHorizontal, t as X } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { a as DialogPortal, i as DialogOverlay, n as DialogClose, o as DialogTitle, r as DialogContent, s as DialogTrigger, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as cn } from "./router-CWg1nYs3.mjs";
import { i as ResearchLink, n as GuideLink, r as LanguageSwitch, s as useT, t as Brand } from "./language-switch-3fae6Zdy.mjs";
import { a as Skeleton, c as findOpportunities, d as fmtUsd, f as runScan, h as venueUrl, i as OpportunityCard, n as FILTER_PRESETS, o as SpreadChart, p as useFilters, r as Input, s as VENUES, t as Button, u as fmtTime } from "./spread-chart-BrcNkmRI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-prjmYz90.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageSwitch, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshButton, {
								loading,
								elapsed,
								onRefresh
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResearchLink, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuideLink, {})
						]
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
					className: "sticky top-0 z-30 border-b border-border bg-bg/90 px-3 py-2.5 backdrop-blur-sm lg:hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, { compact: true }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex shrink-0 items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageSwitch, { compact: true }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResearchLink, { compact: true }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuideLink, { compact: true }),
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
									compact: true,
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
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-pretty text-xs text-muted",
								children: [
									t("disclaimer", { notional: fmtUsd(filters.notional, locale) }),
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/docs",
										className: "text-fg underline-offset-2 hover:underline",
										children: t("guide")
									})
								]
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
function RefreshButton({ loading, elapsed, onRefresh, compact = false }) {
	const { t } = useT();
	const label = loading ? elapsed ? `${(elapsed / 1e3).toFixed(0)} s` : t("scanning") : t("refresh");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		onClick: onRefresh,
		disabled: loading,
		size: compact ? "icon" : "default",
		className: compact ? "shrink-0" : "min-w-32 lg:w-full",
		"aria-label": t("refresh"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: cn("size-4", loading && "animate-spin") }), compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: label
		}) : label]
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
		children: venues.map((venue) => {
			const href = venueUrl(venue.id);
			const className = cn("shrink-0 rounded-full px-2.5 py-1 font-mono text-xs tabular-nums shadow-border", venue.error ? "text-loss" : "text-muted", href && "hover:text-fg");
			const label = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				venue.label,
				" ",
				venue.error ? "—" : venue.count
			] });
			if (!href) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				title: venue.error ?? t("markets", { count: venue.count }),
				className,
				children: label
			}, venue.id);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href,
				target: "_blank",
				rel: "noopener noreferrer",
				title: t("openVenue", { venue: venue.label }),
				className,
				children: label
			}, venue.id);
		})
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
