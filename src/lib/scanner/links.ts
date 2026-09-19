export const VENUE_URL: Record<string, string> = {
  // Omni reads `?ref=` then strips it from the URL (in-memory only). /markets
  // forces a navigation; the access code still has to be entered on first signup.
  variational: "https://omni.variational.io/markets?ref=OMNI35WM137P",
  hyperliquid: "https://app.hyperliquid.xyz/join/AMYUKI",
  carbon: "https://app.carbon.inc/trade?ref=Amyuki",
  carbon_tradfi: "https://app.carbon.inc/tradfi?ref=Amyuki",
  extended: "https://app.extended.exchange",
  lighter: "https://app.lighter.xyz",
  paradex: "https://app.paradex.trade",
  orderly: "https://app.orderly.network",
  backpack: "https://backpack.exchange",
  aster: "https://www.asterdex.com",
  pacifica: "https://app.pacifica.fi",
  hibachi: "https://hibachi.xyz",
  gtrade: "https://gains.trade",
  grvt: "https://grvt.io",
  qfex: "https://www.qfex.com",
  polymarket: "https://polymarket.com",
};

export const VENUE_ACCESS_CODE: Record<string, string> = {
  variational: "OMNI35WM137P",
  carbon: "Amyuki",
  carbon_tradfi: "Amyuki",
};

export function venueUrl(id: string): string | undefined {
  return VENUE_URL[id];
}

export function venueAccessCode(id: string): string | undefined {
  return VENUE_ACCESS_CODE[id];
}
