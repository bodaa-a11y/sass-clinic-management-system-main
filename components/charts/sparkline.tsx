'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showTrend?: boolean;
  width?: number;
}

export function Sparkline({
  data,
  color = '#0066CC',
  height = 40,
  showTrend = false,
  width = 100,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({
    index,
    value,
  }));

  const firstValue = data[0];
  const lastValue = data[data.length - 1];
  const trend = lastValue - firstValue;
  const trendPercent = firstValue > 0 ? ((trend / firstValue) * 100).toFixed(1) : '0';
  const isPositive = trend >= 0;

  return (
    <div className="flex items-center gap-2">
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white border border-gray-200 rounded px-2 py-1 text-xs shadow">
                    {payload[0].value}
                  </div>
                );
              }
              return null;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      {showTrend && (
        <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{trendPercent}%
        </span>
      )}
    </div>
  );
}
