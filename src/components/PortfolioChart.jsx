import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatKRWCompact } from '../lib/format'
import { useIsMobile } from '../lib/useIsMobile'

export default function PortfolioChart({ series }) {
  const isMobile = useIsMobile()
  const tickStep = Math.max(1, Math.floor(series.length / (isMobile ? 4 : 8)))

  return (
    <div className="chart-block">
      <h3>평가금액 vs 누적 투자원금</h3>
      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: isMobile ? 4 : 16, left: isMobile ? 0 : 8, bottom: 8 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-muted)', fontSize: isMobile ? 10 : 12 }}
              interval={tickStep}
              stroke="var(--border-strong)"
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: isMobile ? 10 : 12 }}
              stroke="var(--border-strong)"
              width={isMobile ? 56 : 80}
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
    </div>
  )
}
