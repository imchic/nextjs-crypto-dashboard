"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartDataPoint } from "@/types/crypto";

interface PriceChartProps {
  data: ChartDataPoint[];
  color?: string;
}

interface TooltipPayload {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-lg">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-white font-semibold">
          $
          {payload[0].value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
        </p>
      </div>
    );
  }
  return null;
}

export default function PriceChart({ data, color = "#3b82f6" }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No chart data available
      </div>
    );
  }

  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));
  const isPositive = data[data.length - 1].price >= data[0].price;
  const chartColor = isPositive ? "#22c55e" : "#ef4444";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#374151" }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minPrice * 0.995, maxPrice * 1.005]}
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#374151" }}
          tickFormatter={(v: number) =>
            `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
          }
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="price"
          stroke={chartColor}
          strokeWidth={2}
          fill="url(#priceGradient)"
          dot={false}
          activeDot={{ r: 4, fill: chartColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
