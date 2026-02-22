import { Coin, MarketChartData } from "@/types/crypto";

const BASE_URL = "https://api.coingecko.com/api/v3";

export async function getTopCoins(): Promise<Coin[]> {
  const res = await fetch(
    `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch coins: ${res.status}`);
  }
  return res.json();
}

export async function getCoinMarketChart(id: string): Promise<MarketChartData> {
  const res = await fetch(
    `${BASE_URL}/coins/${id}/market_chart?vs_currency=usd&days=7`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch chart data: ${res.status}`);
  }
  return res.json();
}

export async function getCoinDetails(id: string): Promise<Coin> {
  const res = await fetch(
    `${BASE_URL}/coins/markets?vs_currency=usd&ids=${id}&order=market_cap_desc&per_page=1&page=1&sparkline=false`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch coin details: ${res.status}`);
  }
  const data: Coin[] = await res.json();
  if (!data || data.length === 0) {
    throw new Error("Coin not found");
  }
  return data[0];
}

export function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatPrice(value: number): string {
  if (value < 0.01) return `$${value.toFixed(6)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
