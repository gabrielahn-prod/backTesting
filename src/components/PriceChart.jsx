import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useIsMobile } from '../lib/useIsMobile'

const MA_COLORS = ['var(--series-2)', 'var(--series-3)', 'var(--series-4)']

export default function PriceChart({ chartData, maPeriods, events, currency }) {
  const isMobile = useIsMobile()
  const eventsByPeriod = new Map(maPeriods.map((p) => [p, []]))
  events.forEach((e) => eventsByPeriod.get(e.period)?.push({ date: e.date, y: e.close }))

  const tickStep = Math.max(1, Math.floor(chartData.length / (isMobile ? 4 : 8)))

  return (
    <div className="chart-block">
      <h3>가격 &amp; 이동평균선</h3>
      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: isMobile ? 4 : 16, left: isMobile ? 0 : 8, bottom: 8 }}>
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
            width={isMobile ? 48 : 70}
            domain={['auto', 'auto']}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <Tooltip
            contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', fontSize: 12 }}
            labelStyle={{ color: 'var(--text-primary)' }}
            formatter={(value, name) => [typeof value === 'number' ? value.toFixed(2) : value, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
          <Line
            type="monotone"
            dataKey="close"
            name={`종가 (${currency})`}
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {maPeriods.map((period, i) => (
            <Line
              key={period}
              type="monotone"
              dataKey={`ma${period}`}
              name={`${period}일선`}
              stroke={MA_COLORS[i % MA_COLORS.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
          {maPeriods.map((period, i) => (
            <Scatter
              key={`ev-${period}`}
              data={eventsByPeriod.get(period)}
              dataKey="y"
              name={`${period}일선 추가매수`}
              fill={MA_COLORS[i % MA_COLORS.length]}
              shape="circle"
              legendType="none"
            />
          ))}
        </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
