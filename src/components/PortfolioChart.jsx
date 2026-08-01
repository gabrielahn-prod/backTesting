import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatKRWCompact } from '../lib/format'

export default function PortfolioChart({ series }) {
  const tickStep = Math.max(1, Math.floor(series.length / 8))

  return (
    <div className="chart-block">
      <h3>평가금액 vs 누적 투자원금</h3>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            interval={tickStep}
            stroke="var(--border-strong)"
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            stroke="var(--border-strong)"
            width={80}
            tickFormatter={(v) => formatKRWCompact(v)}
          />
          <Tooltip
            contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', fontSize: 12 }}
            labelStyle={{ color: 'var(--text-primary)' }}
            formatter={(value, name) => [formatKRWCompact(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
          <Area
            type="monotone"
            dataKey="portfolioValue"
            name="평가금액"
            stroke="var(--series-1)"
            fill="var(--series-1)"
            fillOpacity={0.12}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="invested"
            name="누적 투자원금"
            stroke="var(--series-2)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
