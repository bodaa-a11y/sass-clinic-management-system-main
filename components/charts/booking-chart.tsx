'use client';

import { LineChart, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BookingChartProps {
  data: Array<{
    date: string;
    appointments: number;
  }>;
  height?: number;
}

export function BookingChart({ data, height = 300 }: BookingChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0066CC" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#0066CC" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="date" 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow">
                  <p className="text-xs text-gray-600">{payload[0].payload.date}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {payload[0].value} موعد
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="appointments"
          stroke="#0066CC"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorAppointments)"
        />
        <Line
          type="monotone"
          dataKey="appointments"
          stroke="#0066CC"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
