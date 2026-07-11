'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface VitalDataPoint {
  date: string
  value: number
}

interface VitalsTrendlineProps {
  data: VitalDataPoint[]
  color?: string
  label: string
  unit?: string
}

export function VitalsTrendline({ data, color = '#3b82f6', label, unit = '' }: VitalsTrendlineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-16 flex items-center justify-center text-gray-400 text-sm">
        لا يوجد بيانات
      </div>
    )
  }

  const formattedData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
    value: d.value
  }))

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}${unit}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: any) => [`${value}${unit}`, label]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
