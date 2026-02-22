import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCoinDetails, getCoinMarketChart, formatPrice, formatCurrency } from "@/lib/api";
import { ChartDataPoint } from "@/types/crypto";
import PriceChart from "@/components/PriceChart";

export const dynamic = "force-dynamic";

interface CoinPageProps {
  params: Promise<{ id: string }>;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-800 rounded w-48" />
      <div className="bg-gray-800 rounded-xl p-6 h-48" />
      <div className="bg-gray-800 rounded-xl p-6 h-80" />
    </div>
  );
}

async function CoinContent({ id }: { id: string }) {
  let coin;
  let chartData: ChartDataPoint[] = [];

  try {
    coin = await getCoinDetails(id);
  } catch {
    return (
      <div className="text-center py-16">
        <div className="text-red-400 text-6xl mb-4">⚠</div>
        <h2 className="text-xl font-semibold text-white mb-2">Coin not found</h2>
        <p className="text-gray-400 mb-6">
          Unable to load data for &quot;{id}&quot;.
        </p>
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  try {
    const marketChart = await getCoinMarketChart(id);
    chartData = marketChart.prices.map(([timestamp, price]) => ({
      date: new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      price,
    }));
  } catch {
    // chart data is optional
  }

  const priceChange = coin.price_change_percentage_24h;
  const isPositive = priceChange >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Image
          src={coin.image}
          alt={coin.name}
          width={48}
          height={48}
          className="rounded-full"
        />
        <div>
          <h1 className="text-3xl font-bold text-white">{coin.name}</h1>
          <span className="text-gray-400 uppercase text-sm font-medium">
            {coin.symbol}
          </span>
        </div>
        <span className="ml-auto bg-gray-800 text-gray-400 text-sm px-3 py-1 rounded-full border border-gray-700">
          Rank #{coin.market_cap_rank}
        </span>
      </div>

      {/* Price Card */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Current Price</p>
            <p className="text-4xl font-bold text-white">
              {formatPrice(coin.current_price)}
            </p>
          </div>
          <div
            className={`flex items-center gap-1 text-lg font-semibold ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            <span>{isPositive ? "▲" : "▼"}</span>
            <span>
              {isPositive ? "+" : ""}
              {priceChange.toFixed(2)}% (24h)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
              Market Cap
            </p>
            <p className="text-white font-medium">
              {formatCurrency(coin.market_cap)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
              24h Volume
            </p>
            <p className="text-white font-medium">
              {formatCurrency(coin.total_volume)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
              24h High
            </p>
            <p className="text-green-400 font-medium">
              {formatPrice(coin.high_24h)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
              24h Low
            </p>
            <p className="text-red-400 font-medium">
              {formatPrice(coin.low_24h)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-white font-semibold text-lg mb-4">
          Price Chart (7 Days)
        </h2>
        {chartData.length > 0 ? (
          <PriceChart data={chartData} />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Chart data unavailable
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-white font-semibold text-lg mb-4">
          Additional Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "All-Time High", value: formatPrice(coin.ath), sub: `${coin.ath_change_percentage.toFixed(1)}% from current price`, color: coin.ath_change_percentage >= 0 ? "text-green-400" : "text-red-400" },
            { label: "All-Time Low", value: formatPrice(coin.atl), sub: `+${coin.atl_change_percentage.toFixed(0)}% from ATL`, color: "text-green-400" },
            { label: "Circulating Supply", value: `${(coin.circulating_supply / 1e6).toFixed(2)}M ${coin.symbol.toUpperCase()}`, sub: "In circulation", color: "text-blue-400" },
            ...(coin.total_supply ? [{ label: "Total Supply", value: `${(coin.total_supply / 1e6).toFixed(2)}M ${coin.symbol.toUpperCase()}`, sub: "Max tokens", color: "text-purple-400" }] : []),
            { label: "Market Cap (USD)", value: formatCurrency(coin.market_cap), sub: "Total market capitalization", color: "text-yellow-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className={`font-semibold ${stat.color}`}>{stat.value}</p>
              <p className="text-gray-500 text-xs mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function CoinPage({ params }: CoinPageProps) {
  const { id } = await params;

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Dashboard
      </Link>
      <Suspense fallback={<LoadingSkeleton />}>
        <CoinContent id={id} />
      </Suspense>
    </div>
  );
}
