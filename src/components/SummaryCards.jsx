import { formatKRW, formatKRWCompact, formatMultiple, formatPercent } from '../lib/format'

function Card({ label, value, sub, tone }) {
  return (
    <div className={`card${tone ? ` card-${tone}` : ''}`}>
      <span className="card-label">{label}</span>
      <span className="card-value">{value}</span>
      {sub && <span className="card-sub">{sub}</span>}
    </div>
  )
}

export default function SummaryCards({ result, taxEnabled, taxRate = 0.22 }) {
  const { main, currency } = result
  const isForeign = currency && currency !== 'KRW'
  const gain = main.finalValue - main.totalInvested
  const postTax = isForeign && taxEnabled ? main.finalValue - Math.max(0, gain) * taxRate : null

  return (
    <div className="cards">
      <Card label="총 투자 원금" value={formatKRWCompact(main.totalInvested)} sub={formatKRW(main.totalInvested)} />
      <Card
        label={postTax != null ? '최종 평가액 (세전)' : '최종 평가액'}
        value={formatKRWCompact(main.finalValue)}
        sub={formatKRW(main.finalValue)}
      />
      {postTax != null && (
        <Card label="최종 평가액 (세후 22%)" value={formatKRWCompact(postTax)} sub={formatKRW(postTax)} tone="warn" />
      )}
      <Card label="원금 대비" value={formatMultiple(main.multiple)} />
      <Card label="연환산 수익률 (IRR)" value={formatPercent(main.irr)} tone={main.irr >= 0 ? 'good' : 'bad'} />
      {main.minRatioDate && (
        <Card
          label="최대 버틴 구간"
          value={formatPercent(main.minRatio - 1)}
          sub={`${main.minRatioDate} 기준 원금 대비 평가액`}
          tone="bad"
        />
      )}
    </div>
  )
}
