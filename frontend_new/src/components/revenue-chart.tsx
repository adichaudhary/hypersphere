import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  time: string;
  revenue: number;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
  isDark?: boolean;
}

export function RevenueChart({ data, isDark }: RevenueChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e2e8f0'} />
          <XAxis 
            dataKey="time" 
            stroke={isDark ? '#9ca3af' : '#64748b'}
            tick={{ fill: isDark ? '#9ca3af' : '#64748b', fontSize: 12 }}
          />
          <YAxis 
            stroke={isDark ? '#9ca3af' : '#64748b'}
            tick={{ fill: isDark ? '#9ca3af' : '#64748b', fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              color: isDark ? '#f1f5f9' : '#334155'
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
            labelStyle={{ color: isDark ? '#f1f5f9' : '#334155' }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke={isDark ? '#818cf8' : '#6366f1'} 
            strokeWidth={3}
            dot={{ fill: isDark ? '#818cf8' : '#6366f1', r: 4 }}
            activeDot={{ r: 6, fill: isDark ? '#a5b4fc' : '#4f46e5' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}