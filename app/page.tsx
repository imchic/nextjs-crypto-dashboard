import { Suspense } from "react";
import { getTopCoins } from "@/lib/api";
import CoinTable from "@/components/CoinTable";
import MarketStats from "@/components/MarketStats";

export const dynamic = "force-dynamic";

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4 h-24" />
        ))}
      </div>
      <div className="bg-gray-800 rounded-xl h-96" />
    </div>
  );
}

async function DashboardContent() {
  let coins;
  try {
    coins = await getTopCoins();
  } catch {
    return (
      <div className="text-center py-16">
        <div className="text-red-400 text-6xl mb-4">⚠</div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Failed to load market data
        </h2>
        <p className="text-gray-400">
          Unable to fetch data from CoinGecko API. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <>
      <MarketStats coins={coins} />
      <CoinTable coins={coins} />
    </>
  );
}

export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Cryptocurrency Market
        </h1>
        <p className="text-gray-400">
          Live prices and market data for top cryptocurrencies
        </p>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
