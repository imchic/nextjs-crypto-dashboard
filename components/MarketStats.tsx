import { Coin } from "@/types/crypto";
import { formatCurrency } from "@/lib/api";

interface MarketStatsProps {
  coins: Coin[];
}

export default function MarketStats({ coins }: MarketStatsProps) {
  const totalMarketCap = coins.reduce((sum, coin) => sum + coin.market_cap, 0);
  const totalVolume = coins.reduce((sum, coin) => sum + coin.total_volume, 0);
  const gainers = coins.filter((c) => c.price_change_percentage_24h > 0).length;
  const losers = coins.filter((c) => c.price_change_percentage_24h < 0).length;
  const avgChange =
    coins.reduce((sum, c) => sum + c.price_change_percentage_24h, 0) /
    coins.length;

  const stats = [
    {
      label: "Total Market Cap",
      value: formatCurrency(totalMarketCap),
      sub: "Top 20 coins",
      color: "text-blue-400",
    },
    {
      label: "24h Volume",
      value: formatCurrency(totalVolume),
      sub: "Total trading volume",
      color: "text-purple-400",
    },
    {
      label: "Avg 24h Change",
      value: `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`,
      sub: `${gainers} gainers / ${losers} losers`,
      color: avgChange >= 0 ? "text-green-400" : "text-red-400",
    },
    {
      label: "Coins Tracked",
      value: coins.length.toString(),
      sub: "By market cap rank",
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-gray-800 rounded-xl p-4 border border-gray-700"
        >
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          <p className={`text-xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
          <p className="text-gray-500 text-xs">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}
