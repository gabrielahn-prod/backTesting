import { useState } from 'react'
import { subDays, format } from 'date-fns'
import ControlsForm from './components/ControlsForm'
import SummaryCards from './components/SummaryCards'
import ComparisonTable from './components/ComparisonTable'
import PriceChart from './components/PriceChart'
import PortfolioChart from './components/PortfolioChart'
import { fetchDailyHistory, fetchUsdKrwHistory } from './lib/yahooApi'
import { runBacktest } from './lib/backtest'
import './App.css'

const DEFAULT_FORM = {
  symbol: 'QLD',
  startDate: '2007-01-02',
  endDate: '2017-12-29',
  frequency: 'daily',
  baseAmount: 50000,
  rules: [
    { period: 200, amount: 50000 },
    { period: 600, amount: 50000 },
  ],
  taxEnabled: true,
}

function App() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const maxPeriod = form.rules.reduce((m, r) => Math.max(m, r.period), 0)
      // MA period is in trading days; pad generously for weekends/holidays.
      const warmupDays = Math.ceil(maxPeriod * 1.6) + 40
      const fetchStart = format(subDays(new Date(`${form.startDate}T00:00:00Z`), warmupDays), 'yyyy-MM-dd')

      const priceData = await fetchDailyHistory(form.symbol.trim(), fetchStart, form.endDate)

      let fxRows = null
      if (priceData.currency && priceData.currency !== 'KRW') {
        fxRows = await fetchUsdKrwHistory(fetchStart, form.endDate)
      }

      const bt = runBacktest({
        priceRows: priceData.rows,
        fxRows,
        currency: priceData.currency,
        startDate: form.startDate,
        endDate: form.endDate,
        frequency: form.frequency,
        baseAmount: form.baseAmount,
        rules: form.rules,
      })

      setResult(bt)
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>DCA + 이동평균선 추가매수 백테스터</h1>
        <p className="muted">
          기간 동안 정기적으로 적립매수하고, 종가가 지정한 이동평균선 아래로 떨어지면 추가매수하는 전략을
          시뮬레이션합니다. 데이터는 Yahoo Finance 기준이며 배당재투자·매매수수료·슬리피지는 반영하지 않습니다.
        </p>
      </header>

      <ControlsForm form={form} onChange={setForm} onSubmit={handleSubmit} loading={loading} />

      {error && <div className="banner banner-error">{error}</div>}

      {result?.warnings?.length > 0 && (
        <div className="banner banner-warn">
          {result.warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      {result && (
        <>
          <section>
            <h2>결과 요약</h2>
            <p className="muted">
              실제 시뮬레이션 기간: {result.effectiveStart} ~ {result.effectiveEnd} · 총 매수일 {result.buyCount}회
            </p>
            <SummaryCards result={result} taxEnabled={form.taxEnabled} />
          </section>

          <section>
            <h2>전략 비교</h2>
            <ComparisonTable scenarios={result.scenarios} />
          </section>

          <section>
            <PriceChart
              chartData={result.main.chartData}
              maPeriods={result.main.maPeriods}
              events={result.main.events}
              currency={result.currency}
            />
          </section>

          <section>
            <PortfolioChart series={result.main.series} />
          </section>
        </>
      )}
    </div>
  )
}

export default App
