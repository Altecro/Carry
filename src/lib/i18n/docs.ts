import type { Locale } from "./messages";

export type DocsBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "example" };

export type DocsSection = {
  id: string;
  title: string;
  blocks: DocsBlock[];
};

type DocsCopy = {
  kicker: string;
  title: string;
  lead: string;
  sections: DocsSection[];
};

const fr: DocsCopy = {
  kicker: "Guide",
  title: "Comment lire Carry",
  lead: "Carry croise les funding rates des DEX et te propose, pour chaque ticker, le meilleur LONG d’un côté et le meilleur SHORT de l’autre. Lecture seule : aucun ordre n’est envoyé.",
  sections: [
    {
      id: "carte",
      title: "Une carte, deux jambes",
      blocks: [
        {
          type: "p",
          text: "Le gros chiffre en haut à droite est l’écart APR : ce que tu empoches si tu ouvres les deux jambes et que les taux tiennent. En dessous, le gain estimé par jour pour le notionnel choisi (1 000 $ par défaut).",
        },
        {
          type: "ul",
          items: [
            "LONG — tu achètes le perp sur cette place.",
            "SHORT — tu vends le perp sur l’autre place.",
            "Les deux nombres sous LONG et SHORT sont ton PnL de funding, pas le taux affiché sur le DEX.",
          ],
        },
        {
          type: "p",
          text: "L’écart affiché est la somme des deux PnL. LONG −12 % + SHORT +64 % = +52 % d’écart.",
        },
      ],
    },
    {
      id: "affichage",
      title: "Pourquoi le signe est inversé",
      blocks: [
        {
          type: "p",
          text: "Sur Hyperliquid, Variational, Lighter et la plupart des DEX, un funding de +50 % signifie : les longs paient les shorts. Un −50 % signifie l’inverse. Carry n’affiche pas ce ticker. Il affiche ce que tu gagnes ou paies sur la jambe que tu prends.",
        },
        { type: "example" },
        {
          type: "p",
          text: "Vert = tu encaisses. Rouge = tu paies. Plus besoin d’inverser de tête.",
        },
      ],
    },
    {
      id: "carbon",
      title: "Carbon est déjà en PnL",
      blocks: [
        {
          type: "p",
          text: "Carbon n’utilise pas la convention des autres DEX. Sur l’app Carbon, cliquer Long montre le PnL du long : −0,5 % = le long paie vraiment 0,5 %. Carry recopie ce chiffre, sans le retourner.",
        },
        {
          type: "ul",
          items: [
            "Long et short ont souvent des taux différents (solver, pas un carnet unique).",
            "Les perps crypto Carbon règlent en 8 h, sauf quelques marchés horaires (ONE, LSK…).",
            "Carbon TradFi (actions, FX) règle une fois par jour, comme un overnight TradFi.",
            "L’OI Carbon est un plafond de notionnel, pas un open interest réel.",
          ],
        },
      ],
    },
    {
      id: "intervalle",
      title: "Intervalle de paiement",
      blocks: [
        {
          type: "p",
          text: "Sous chaque jambe, à côté de l’OI, tu vois 1 h, 8 h ou 24 h : c’est la fréquence à laquelle le funding est réellement payé. L’APR annualise ce paiement (× 8 760 pour 1 h, × 1 095 pour 8 h, × 365 pour 24 h).",
        },
        {
          type: "callout",
          text: "Un APR énorme sur un paiement horaire peut disparaître à la fenêtre suivante. Un 8 h ou 24 h bouge moins vite.",
        },
      ],
    },
    {
      id: "presets",
      title: "Presets",
      blocks: [
        {
          type: "p",
          text: "Les presets changent les seuils, pas le scan. Tu dois cliquer Valider le preset pour les appliquer. Ensuite tu peux encore bouger les sliders.",
        },
        {
          type: "ul",
          items: [
            "Souple — OI et volume élevés, petit écart. Moins d’APR, plus de liquidité.",
            "Classique — le réglage de départ (20 % d’écart, 300 k$ d’OI).",
            "Serré — 45 % d’écart, 100 k$ d’OI. Gros APR, carnets plus fins.",
            "Ultra — sous 50 k$ d’OI. Slippage, fills partiels, parfois des taux fantômes. Taille mini.",
          ],
        },
      ],
    },
    {
      id: "filtres",
      title: "Les lignes sous la carte",
      blocks: [
        {
          type: "ul",
          items: [
            "OI min — le plus petit open interest (ou plafond Carbon) des deux jambes.",
            "vol — plus petit volume 24 h connu. Carbon ne publie pas le volume, il n’est pas exigé.",
            "prix — écart de mark price entre les deux DEX. Au-delà du seuil, souvent deux marchés différents.",
            "coût — frais aller-retour (ouvrir + fermer les deux jambes).",
            "seuil — heures pour rembourser ce coût si l’écart APR tient. Au-delà, le taux a le temps de s’inverser.",
          ],
        },
      ],
    },
    {
      id: "scan",
      title: "Scan, liens, risques",
      blocks: [
        {
          type: "p",
          text: "Le scan lit les API publiques côté serveur, environ toutes les 45 s, ou tout de suite via Actualiser. Les pastilles de places sont des liens (souvent avec le code parrain). Carry ne passe aucun ordre.",
        },
        {
          type: "callout",
          text: "Un funding n’est pas un rendement promis. Taux, OI et prix bougent. Vérifie toujours sur le DEX avant de t’exposer.",
        },
      ],
    },
  ],
};

const en: DocsCopy = {
  kicker: "Guide",
  title: "How to read Carry",
  lead: "Carry crosses DEX funding rates and, for each ticker, picks the best LONG on one venue and the best SHORT on another. Read-only: no orders are sent.",
  sections: [
    {
      id: "carte",
      title: "One card, two legs",
      blocks: [
        {
          type: "p",
          text: "The big number top-right is the APR spread: what you pocket if you open both legs and the rates hold. Under it, the estimated daily gain for your notional ($1,000 by default).",
        },
        {
          type: "ul",
          items: [
            "LONG — you buy the perp on that venue.",
            "SHORT — you sell the perp on the other venue.",
            "The two figures under LONG and SHORT are your funding PnL, not the DEX ticker rate.",
          ],
        },
        {
          type: "p",
          text: "The displayed spread is the sum of the two PnLs. LONG −12% + SHORT +64% = +52% spread.",
        },
      ],
    },
    {
      id: "affichage",
      title: "Why the sign is flipped",
      blocks: [
        {
          type: "p",
          text: "On Hyperliquid, Variational, Lighter and most DEXes, +50% funding means longs pay shorts. −50% means the opposite. Carry does not show that ticker. It shows what you earn or pay on the leg you take.",
        },
        { type: "example" },
        {
          type: "p",
          text: "Green = you collect. Red = you pay. No mental flip required.",
        },
      ],
    },
    {
      id: "carbon",
      title: "Carbon is already PnL",
      blocks: [
        {
          type: "p",
          text: "Carbon does not use the other DEXes’ convention. In the Carbon app, tapping Long shows the long’s PnL: −0.5% means the long actually pays 0.5%. Carry copies that number — it does not invert it.",
        },
        {
          type: "ul",
          items: [
            "Long and short often have different rates (solver quotes, not one book).",
            "Carbon crypto perps settle every 8h, except a few hourly markets (ONE, LSK…).",
            "Carbon TradFi (stocks, FX) settles once a day, like TradFi overnight.",
            "Carbon OI is a notional cap, not true open interest.",
          ],
        },
      ],
    },
    {
      id: "intervalle",
      title: "Payment interval",
      blocks: [
        {
          type: "p",
          text: "Under each leg, next to OI, you see 1h, 8h or 24h: how often funding is actually paid. APR annualizes that payment (× 8,760 for 1h, × 1,095 for 8h, × 365 for 24h).",
        },
        {
          type: "callout",
          text: "A huge APR on an hourly payment can vanish at the next window. 8h or 24h moves more slowly.",
        },
      ],
    },
    {
      id: "presets",
      title: "Presets",
      blocks: [
        {
          type: "p",
          text: "Presets change thresholds, not the scan. Click Apply preset to lock them in. You can still move the sliders afterwards.",
        },
        {
          type: "ul",
          items: [
            "Loose — high OI and volume, small spread. Less APR, more liquidity.",
            "Classic — the default (20% spread, $300k OI).",
            "Tight — 45% spread, $100k OI. Fatter APRs, thinner books.",
            "Ultra — under $50k OI. Slippage, partial fills, sometimes ghost rates. Tiny size.",
          ],
        },
      ],
    },
    {
      id: "filtres",
      title: "The line under the card",
      blocks: [
        {
          type: "ul",
          items: [
            "min OI — the smaller open interest (or Carbon cap) of the two legs.",
            "vol — smaller known 24h volume. Carbon does not publish volume, so it is not required.",
            "gap — mark-price gap between the two DEXes. Above the cap, often two different markets.",
            "cost — round-trip fees (open + close both legs).",
            "payback — hours to recoup that cost if the APR spread holds. Beyond that, the rate has time to flip.",
          ],
        },
      ],
    },
    {
      id: "scan",
      title: "Scan, links, risk",
      blocks: [
        {
          type: "p",
          text: "The scan reads public APIs on the server, about every 45s, or immediately via Refresh. Venue chips are links (often with the referral code). Carry never sends an order.",
        },
        {
          type: "callout",
          text: "Funding is not a promised yield. Rates, OI and prices move. Always check the DEX before you size in.",
        },
      ],
    },
  ],
};

export const DOCS: Record<Locale, DocsCopy> = { fr, en };
