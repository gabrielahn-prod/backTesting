import { formatKRWCompact, formatMultiple, formatPercent } from '../lib/format'

export default function ComparisonTable({ scenarios }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>전략</th>
            <th>총 투자원금</th>
            <th>최종 평가액</th>
            <th>배수</th>
            <th>IRR</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s, i) => (
            <tr key={i} className={i === scenarios.length - 1 ? 'row-highlight' : ''}>
              <td>{s.label}</td>
              <td>{formatKRWCompact(s.totalInvested)}</td>
              <td>{formatKRWCompact(s.finalValue)}</td>
              <td>{formatMultiple(s.multiple)}</td>
              <td>{formatPercent(s.irr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
