"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Coin } from "@/types/crypto";
import { formatCurrency, formatPrice } from "@/lib/api";

interface CoinTableProps {
  coins: Coin[];
  searchQuery?: string;
}

export default function CoinTable({ coins, searchQuery = "" }: CoinTableProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [sortField, setSortField] = useState<keyof Coin>("market_cap_rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = coins.filter(
    (c) =>
      c.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      c.symbol.toLowerCase().includes(localSearch.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleSort = (field: keyof Coin) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: keyof Coin }) => {
    if (sortField !== field)
      return <span className="text-gray-600 ml-1">↕</span>;
    return (
      <span className="text-blue-400 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-white font-semibold text-lg">Top Cryptocurrencies</h2>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Filter coins..."
          className="px-3 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-full sm:w-48"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
              <th
                className="px-4 py-3 text-left cursor-pointer hover:text-white"
                onClick={() => handleSort("market_cap_rank")}
              >
                # <SortIcon field="market_cap_rank" />
              </th>
              <th className="px-4 py-3 text-left">Coin</th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-white"
                onClick={() => handleSort("current_price")}
              >
                Price <SortIcon field="current_price" />
              </th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-white"
                onClick={() => handleSort("price_change_percentage_24h")}
              >
                24h % <SortIcon field="price_change_percentage_24h" />
              </th>
              <th
                className="px-4 py-3 text-right hidden md:table-cell cursor-pointer hover:text-white"
                onClick={() => handleSort("market_cap")}
              >
                Market Cap <SortIcon field="market_cap" />
              </th>
              <th
                className="px-4 py-3 text-right hidden lg:table-cell cursor-pointer hover:text-white"
                onClick={() => handleSort("total_volume")}
              >
                Volume (24h) <SortIcon field="total_volume" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No coins match your search
                </td>
              </tr>
            ) : (
              sorted.map((coin) => (
                <tr
                  key={coin.id}
                  className="hover:bg-gray-750 transition-colors group"
                >
                  <td className="px-4 py-3 text-gray-400">
                    {coin.market_cap_rank}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/coin/${coin.id}`}
                      className="flex items-center gap-3 hover:text-blue-400 transition-colors"
                    >
                      <Image
                        src={coin.image}
                        alt={coin.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div>
                        <span className="text-white font-medium block">
                          {coin.name}
                        </span>
                        <span className="text-gray-400 text-xs uppercase">
                          {coin.symbol}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    {formatPrice(coin.current_price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-medium ${
                        coin.price_change_percentage_24h >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {coin.price_change_percentage_24h >= 0 ? "+" : ""}
                      {coin.price_change_percentage_24h.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 hidden md:table-cell">
                    {formatCurrency(coin.market_cap)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 hidden lg:table-cell">
                    {formatCurrency(coin.total_volume)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
